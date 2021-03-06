﻿/** Copyright 2012 Washington State Department of Transportation.  Licensed under The MIT License (http://opensource.org/licenses/MIT). **/
/*global require, esri, dojo, jQuery, Proj4js, ogc*/
/*jslint nomen: true, regexp: true, white:true, plusplus:true */
/// <reference path="jsapi_vsdoc_v31.js" />
/// <reference path="ogc/ogcSimpleGeometry.vsdoc.js" />


(function ($) {
	"use strict";

	function createLocationId() {
		return new Date().getTime();
	}

	function RouteParts(main, start, end) {
		/// <summary>Represents the parts that make up a route: main, start, end.</summary>
		/// <param name="main" type="String">The name of the main street that the other streets cross.</param>
		/// <param name="start" type="String">The name of the first cross street.</param>
		/// <param name="end" type="String">The name of the last cross street.</param>
		this.main = main;
		this.start = start;
		this.end = end;
	}

	function groupGraphicsByAttribute(graphics, attribute) {
		/// <summary>Arranges graphics into groups based on an attribute.</summary>
		/// <param name="graphics" type="esri.Graphic[]">An array of graphics.  Although this function is designed for use with esri.Graphic objects, any object with an "attributes" object property will actually work.</param>
		/// <param name="attribute" type="String">The name of the attribute on which the graphics will be grouped.</param>
		/// <returns type="Object">Returns an object.  Each property of the object will be named after the attribute value.</returns>

		var i, l, graphic, output = {}, attrVal;

		for (i = 0, l = graphics.length; i < l; i++) {
			graphic = graphics[i];
			attrVal = String(graphic.attributes[attribute]);
			if (!output.hasOwnProperty(attrVal)) {
				output[attrVal] = [];
			}
			output[attrVal].push(graphic);
		}

		return output;
	}

	function splitRouteName(routeName) {
		/// <summary>Splits a route name into its four component street names.</summary>
		/// <returns type="Object">An object with the following properties: main, start, and end.</returns>
		var match, streetNames, routeNameRegex, crossStreetRegex;
		// This will be used to split the segment names returned by the routing (network) service.
		routeNameRegex = /^([^\-&]+?)\s*&\s*([^\-&]+?)\s*-\s*([^\-&]+?)\s*&\s*([^\-&]+)$/i;
		// This will be used to split the name of a route with a name formatted as "Main Street from Cross Street 1 to Cross Street 2".
		crossStreetRegex = /^(.+)\s+from\s+(.+)\s+to\s+(.+)$/; // Match results [full name, main street, from street, to street]. 
		// E.g., ["Main Street from Cross Street 1 to Cross Street 2", "Main Street", "Cross Street 1", "Cross Street 2"]

		function findMainStreetName(streetNames) {
			/// <summary>Compares the list of street names and determines which is the main street.  This will be the street name that is included in the array twice.</summary>
			/// <param name="streetNames" type="String[]">An array containing five strings.</param>
			/// <returns type="Object" />

			var i, j, main, output = null;

			for (i = 1; i <= 2; i += 1) {
				for (j = 3; j <= 4; j += 1) {
					if (streetNames[i] === streetNames[j]) {
						main = streetNames[i];
						break;
					}
				}
				if (main) {
					break;
				}
			}

			if (main) {
				output = new RouteParts(main,
					i === 1 ? streetNames[2] : streetNames[1],
					j === 3 ? streetNames[4] : streetNames[3]
				);
			}

			return output;
		}

		match = routeNameRegex.exec(routeName);

		if (match) {
			streetNames = findMainStreetName(match);
			if (!streetNames) {
				streetNames = match;
			}
		} else {
			match = routeName.match(crossStreetRegex);
			if (match) {
				streetNames = new RouteParts(match[1], match[2], match[3]);
			} else {
				streetNames = null;
			}
		}

		return streetNames;
	}

	function addGeometryToGraphic(graphic) {
		/// <summary>Adds geometry to a graphic if it does not already have one.</summary>
		/// <returns type="esri.Graphic">Returns the same graphic that was input to the function.</returns>
		var geometry, projector;

		function projectGeometry(geometry) {
			if (geometry.spatialReference.wkid === 2927) {
				geometry = projector.project(geometry);
			}
			if (graphic.setGeometry !== undefined) {
				graphic.setGeometry(geometry);
			} else {
				graphic.geometry = geometry;
			}
			return geometry;
		}

		projector = new Proj4js.EsriProjector(new Proj4js.Proj("EPSG:2927"), new Proj4js.Proj("EPSG:3857"));

		if (!graphic.geometry) {  // If graphic does not have geometry...

			if (graphic.attributes.ogcSimpleGeometry) {

				// Ensure that ogcSimpleGeometry is an ogc.SimpleGeometry object.
				if (graphic.attributes.ogcSimpleGeometry.isInstanceof === undefined || !graphic.attributes.ogcSimpleGeometry.isInstanceOf(ogc.SimpleGeometry)) {
					graphic.attributes.ogcSimpleGeometry = new ogc.SimpleGeometry(graphic.attributes.ogcSimpleGeometry);
				}

				if (graphic.attributes.ogcSimpleGeometry.isInstanceOf !== undefined && graphic.attributes.ogcSimpleGeometry.isInstanceOf(ogc.SimpleGeometry)) {
					geometry = graphic.attributes.ogcSimpleGeometry.toEsriGeometry();

					projectGeometry(geometry);
				} else {
					throw new Error("Graphic does not have geometry.  ogcSimpleGeometry attribute is incorrect type.");
				}
			} else {
				throw new Error("Graphic has neither geometry nor simpleGeometry attribute.");
			}

			if (typeof (graphic.isInstanceOf) !== "function" || !graphic.isInstanceOf(esri.Graphic)) {
				graphic = new esri.Graphic(graphic);
			}
		} else {
			geometry = graphic.geometry;

			if (typeof (graphic.isInstanceOf) !== "function" || !graphic.isInstanceOf(esri.Graphic)) {
				graphic = new esri.Graphic(graphic);
			}
		}

		return graphic;
	}

	function projectGraphicsToSps(graphics) {
		/// <summary>
		/// Projects either a single graphic or an array of graphics from 3857 to 2927.
		/// Also removes some attributes related to finding a route that are not needed for this widget.
		/// </summary>
		/// <param name="graphics" type="esri.Graphic[]|esri.Graphic">Either a single esri.Graphic or an array of esri.Graphic objects.</param>
		/// <returns type="esri.Graphic[]|esri.Graphic">The type of the output will match the the type of the "graphics" parameter.</returns>
		var projector, output, isSingleGraphic;
		projector = new Proj4js.EsriProjector(new Proj4js.Proj("EPSG:3857"), new Proj4js.Proj("EPSG:2927"));

		// Detect if input is a single graphic instead of an array of graphics.
		isSingleGraphic = graphics.attributes;
		// Put individual graphic inside of an array.
		if (isSingleGraphic) {
			graphics = [graphics];
		}

		// Project the graphics in the array.
		output = projector.projectGraphics(graphics, function (graphic) {
			var removeRe, name;

			// Remove unwanted properties.
			removeRe = /(?:(?:(?:First)|(?:Last))StopId)|(?:ObjectId)|(?:StopCount)|(Total_Time)|(Shape_Length)/i;
			for (name in graphic.attributes) {
				if (graphic.attributes.hasOwnProperty(name) && removeRe.test(name)) {
					delete graphic.attributes[name];
				}
			}

			// Add a property for the OGC Simple Geometry.
			graphic.attributes.ogcSimpleGeometry = new ogc.SimpleGeometry(graphic.geometry, null, true);
		});

		// Return either a single projected graphic or an array of projected graphics, depending on the type of the input "graphics" parameter.
		return isSingleGraphic ? output[0] : output;
	}

	$.widget("ui.localRoadsSelector", {
		options: {
			reverseGeocodeHandlerUrl: "/ReverseGeocodeIntersection.ashx",
			routeTaskUrl: "http://tasks.arcgisonline.com/ArcGIS/rest/services/NetworkAnalysis/ESRI_Route_NA/NAServer/Route",
			layers: [
					{
						url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/",
						type: "esri.layers.ArcGISTiledMapServiceLayer"
					}
			],
			resizeWithWindow: true
		},
		_showMessage: function (message, title) {
			/// <summary>Shows a message in a jQuery UI dialog.</summary>
			$("<div>").text(message).dialog({
				title: title || "Message",
				modal: true,
				buttons: {
					"OK": function () {
						$(this).dialog("close");
					}
				},
				close: function () {
					// Destroy the dialog and remove it from the DOM when closed.
					$(this).dialog("destroy").remove();
				}
			});
			return this;
		},
		_busyDialog: null,
		_showBusyDialog: function (message) {
			// Create the busy dialog if it does not already exist.
			if (!this._busyDialog) {
				this._busyDialog = $("<div>").addClass("ui-local-roads-selector-busy-dialog");
				// Add the paragraph where the message text will go.
				$("<p>").addClass("ui-local-roads-selector-busy-dialog-message").appendTo(this._busyDialog);
				// Add the progress bar.
				$("<progress>").appendTo(this._busyDialog);
				this._busyDialog.dialog({
					title: "Please wait...",
					modal: true,
					autoOpen: false
				});
			}
			// Update the message.
			$(".ui-local-roads-selector-busy-dialog-message", this._busyDialog).text(message || "");
			// Open the dialog.
			this._busyDialog.dialog("open");
			return this;
		},
		_hideBusyDialog: function () {
			this._busyDialog.dialog("close");
			return this;
		},
		stopsLayer: null,
		routeLayer: null,
		_tooltip: null,
		_setTooltipStart: function () {
			this._tooltip.html("Click an intersection to begin.");
		},

		_setTooltipNext: function () {
			this._tooltip.html("Click another intersection to draw a route.<br/>Double-click an intersection to end.");
		},
		deleteLastSegment: function () {
			/// <summary>Deletes the last route graphic that was added to the map.</summary>
			/// <returns type="jQuery" />
			var gfx;
			function deleteLastGraphic(layer) {
				/// <summary>Deletes the last graphic in the graphics array of a layer.</summary>
				/// <param name="layer" type="esri.layers.GraphicsLayer">A graphics layer.</param>
				var len;
				if (typeof (layer) === "object" && typeof (layer.isInstanceOf) === "function" && layer.isInstanceOf(esri.layers.GraphicsLayer)) {
					len = layer.graphics.length;
					if (len > 0) {
						layer.remove(layer.graphics[len - 1]);
					}
				}
			}
			deleteLastGraphic(this.routeLayer);
			deleteLastGraphic(this.stopsLayer);

			gfx = this.stopsLayer.graphics;
			// Set the new last graphic's position to end (unless it's the only one).
			if (gfx.length > 1) {
				gfx[gfx.length - 1].attributes.position = "end";
			} else {
				this._setTooltipStart();
			}
			this.stopsLayer.refresh();
			return this;
		},
		clearSegments: function () {
			/// <summary>Deletes all graphics from the map.</summary>
			/// <returns type="jQuery" />
			this.stopsLayer.clear();
			this.routeLayer.clear();
			this._setTooltipStart();
			return this;
		},
		_triggerIntersectionFound: function (graphic) {
			var projectedGraphic = projectGraphicsToSps(graphic);
			this._trigger("intersectionFound", this, { map: graphic, sps: projectedGraphic });
		},
		_triggerRouteFound: function (graphic) {
			var projectedGraphic = projectGraphicsToSps(graphic);
			this._trigger("routeFound", this, { map: graphic, sps: projectedGraphic });
		},
		getRoutes: function (returnUnprojected) {
			/// <summary>Create projected copies of route polyline graphics and return them in an array</summary>
			/// <param name="returnUnprojected" type="Boolean">Optional. If set to true the original routes graphics will be returned; otherwise copies projected to State Plane South will be returned.</param>
			/// <returns type="esri.Graphic[]" />
			var self = this, output;

			if (returnUnprojected) {
				output = self.routeLayer.graphics;
			} else {
				output = projectGraphicsToSps(self.routeLayer.graphics);
			}

			return output;
		},
		getRoutesByAttribute: function (attribute, value, returnUnprojected) {
			/// <summary>Returns all route graphics with an attribute that has a specific value.</summary>
			/// <param name="attribute" type="String">The name of an attribute.</param>
			/// <param name="value">The value of the attribute.</param>
			/// <param name="returnUnprojected" type="Boolean">Optional. If set to true the original routes graphics will be returned; otherwise copies projected to State Plane South will be returned.</param>
			/// <returns type="esri.Graphic[]" />

			var self = this, graphics = self.routeLayer.graphics, output = [], i, l, graphic;

			for (i = 0, l = graphics.length; i < l; i++) {
				graphic = graphics[i];
				if (graphic.hasOwnProperty("attributes") && graphic.attributes.hasOwnProperty(attribute) && graphic.attributes[attribute] === value) {
					// Create a projected copy of the graphic unless caller has specifed that the original, unprojected graphics should be returned.
					if (!returnUnprojected) {
						graphic = projectGraphicsToSps(graphic);
					}
					output.push(graphic);
				}
			}

			return output;
		},
		getGroupedRoutes: function () {
			/// <summary>Gets the route graphics from the map and groups them by their locationId attribute.  Each unique locationId will have corresponding property in the output object.  The value of that property will be an array of esri.Graphic objects.</summary>
			/// <returns type="Object" />
			var routes = this.getRoutes();
			/*jslint eqeq:true*/
			if (routes != null && routes.length > 0) {
				routes = groupGraphicsByAttribute(routes, "locationId");
			} else {
				routes = null;
			}
			/*jslint eqeq:false*/
			return routes;
		},
		getSelectedRoutes: function () {
			/// <summary>Deletes all of the route graphics that have been selected.  Route graphics can be selected by clicking on them.</summary>
			/// <returns type="esri.Graphic[]" />
			var self = this, i, l, graphic, layer, output;
			layer = self.routeLayer;
			output = [];
			for (i = 0, l = self.routeLayer.graphics.length; i < l; i += 1) {
				graphic = layer.graphics[i];
				if (graphic.attributes.selected) {
					output.push(graphic);
				}
			}

			return output;
		},
		addRoute: function (route) {
			/// <summary>Adds a route graphic to the route layer utilizing the addRoutes function.</summary>
			/// <param name="route" type="esri.Graphic">A graphic representing a route.</param>
			/// <returns type="jQuery" />

			// Use the addRoutes method, which handles input route graphics that might need to be modified before adding to the route layer.
			if (route) {
				this.addRoutes([route]);
			}
			return this;
		},
		addRoutes: function (routes) {
			/// <summary>Adds an array of route graphics to the route graphics layer.</summary>
			/// <param name="routes" type="esri.Graphic[]">An array of route graphics.</param>
			/// <returns type="jQuery" />
			var self = this, i, l, graphic, layer;
			layer = self.routeLayer;
			for (i = 0, l = routes.length; i < l; i += 1) {
				graphic = routes[i];
				graphic = addGeometryToGraphic(graphic);
				layer.add(graphic);
			}
			return this;
		},
		deleteRoutes: function (routes) {
			/// <summary>Deletes route graphics from the map.</summary>
			/// <param name="routes" type="esri.Graphic[]">An array of route graphics.</param>
			/// <returns type="jQuery" />
			var self = this, i, l, graphic, layer;
			layer = self.routeLayer;
			for (i = 0, l = routes.length; i < l; i += 1) {
				graphic = routes[i];
				layer.remove(graphic);
			}
			return this;
		},
		deleteRoute: function (route) {
			/// <summary>Deletes a route graphic from the map.</summary>
			/// <param name="route" type="esri.Graphic|String">Either a route graphic or a route's "name" attribute..</param>
			/// <returns type="jQuery" />
			this.routeLayer.remove(route);
			return this;
		},
		deleteRoutesByAttribute: function (attribute, value) {
			/// <summary>Deletes all route graphics with an attribute that has a specific value.</summary>
			/// <param name="attribute" type="String">The name of a grahpic's attribute.</param>
			/// <param name="value">The value of the attribute.</param>

			var matchingGraphics;

			matchingGraphics = this.getRoutesByAttribute(attribute, value, true);
			this.deleteRoutes(matchingGraphics);

			return this;
		},
		removeSelectedRoutes: function () {
			/// <summary>Removes from the map all routes that are currently selected.</summary>
			/// <returns type="jQuery" />
			var routes = this.getSelectedRoutes();
			/*jslint eqeq: true */
			if (routes != null && routes.length > 0) {
				this.deleteRoutes(routes);
			}
			/*jslint eqeq: false */
			return this;
		},
		_create: function () {
			/// <summary>A jQuery widget that allows a user to select local road segments by clicking on intersections.</summary>
			/// <param name="options" type="object">
			/// <para>Options</para>
			/// <para>reverseGeocodeHandlerUrl:	The path to the ReverseGeocodeIntersection.ashx file.</para>
			/// <para>routeTaskUrl:	The URL of the ArcGIS Server route service that will be used to find a line segment between intersections.</para>
			/// <para>layers:	Defines the layer(s) that will appear in the map.</para>
			/// <para>resizeWithWindow: Set to true if the map should resize when the window resizes.  Set to false otherwise.
			/// </param>
			var self = this, startSymbol, defaultSymbol, endSymbol, routeSymbol, routeTask, selectedRouteSymbol, locationId = createLocationId();

			self._tooltip = $("<div>").addClass("ui-local-roads-selector-tooltip").hide().appendTo("body");
			self._setTooltipStart();

			require(["esri/symbol", "esri/graphic", "esri/tasks/route", "esri/tasks/geometry", "ogc/SimpleGeometry", "esri/dijit/BasemapGallery"], function () {
				function handleMapClick(event) {
					var location, prevGraphic, locationEnd = event.type === "dblclick";

					if (!event.graphic) { // If we are clicking on a graphic, we do not want to search for an intersection.

						location = String(event.mapPoint.x) + "," + String(event.mapPoint.y);



						self._showBusyDialog("Searching for intersection...");

						(function (isLastStop) {
							$.get(self.options.reverseGeocodeHandlerUrl, {
								location: location,
								inSR: 102100,
								distance: "10",
								outSR: 102100
							}, function (data, textStatus) {
								var graphic, routeParams;
								if (textStatus === "success") {
									self._setTooltipNext();
									if (data.address && data.location) {
										//// graphic = new esri.Graphic(esri.geometry.fromJson(data.location), startSymbol, data.address, new esri.InfoTemplate("Address", "${Street}<br />${City}, ${State}  ${ZIP}"));
										graphic = new esri.Graphic({
											geometry: esri.geometry.fromJson(data.location),
											attributes: data.address
										});
										graphic.attributes.Name = graphic.attributes.Street;
										// graphic.attributes.locationId = locationId;

										// If no stops have been defined yet, this is the start graphic.  Otherwise its the end graphic.
										graphic.attributes.position = self.stopsLayer.graphics.length === 0 ? "start" : "end";

										self.stopsLayer.add(graphic);

										// Trigger the intersection found event.
										self._triggerIntersectionFound(graphic);

										if (self.stopsLayer.graphics.length >= 2) {
											self._showBusyDialog("Searching for route...");
											// The the second to last graphic.
											prevGraphic = self.stopsLayer.graphics[self.stopsLayer.graphics.length - 2];

											// If the previous graphic also is set as an "end" point, clear this attribute.
											if (prevGraphic.attributes.position === "end") {
												prevGraphic.attributes.position = null;
											}
											// Initialize the route task.
											if (!routeTask) {
												routeTask = new esri.tasks.RouteTask(self.options.routeTaskUrl);
											}
											routeParams = new esri.tasks.RouteParameters();
											routeParams.stops = new esri.tasks.FeatureSet();
											routeParams.stops.features.push(prevGraphic);
											routeParams.stops.features.push(graphic);
											routeParams.stops.geometryType = "point";
											// routeParams.impedanceAttribute = "Length";
											routeParams.restrictionAttributes = ["none"]; // Ignore one-way streets.
											routeParams.returnRoutes = true;
											routeParams.returnDirections = true;
											routeParams.directionLengthUnits = esri.Units.MILES;
											// TODO: Get spatial reference from map instead of creating a new object.
											routeParams.outSpatialReference = new esri.SpatialReference({ wkid: 102100 });

											routeTask.solve(routeParams, function (solveResults) {
												var routeResult, route, segParts;

												function getCardinalDirection(routeResult) {
													/// <summary>Searches a routeResult for a cardinal direction.</summary>

													var features, graphic, i, l, dirRe, match, output = null, turnRE, maneuverMatch, turnDir, cardinalLength = 0;

													dirRe = /(?:north)|(?:south)|(?:east)|(?:west)/i;
													turnRE = /^esriDMT(?:(?:Turn)|(?:Sharp))((?:Left)|(?:Right))$/i;

													features = routeResult.directions.features;

													for (i = 0, l = features.length; i < l; i++) {
														graphic = features[i];
														// TODO: Account for turn after the straight direction to get correct direction.
														if (graphic.attributes.maneuverType === "esriDMTStraight") {
															match = graphic.attributes.text.match(dirRe);
															if (match) {
																output = match[0].toLowerCase();
																cardinalLength = graphic.attributes.length;
															}
														} else {
															maneuverMatch = graphic.attributes.maneuverType.match(turnRE);
															if (maneuverMatch && graphic.attributes.length > cardinalLength) {
																turnDir = maneuverMatch[1];
																// Modify the output cardinal direction...
																if (output === "north") { // output must already exist.
																	output = turnDir === "Left" ? "west" : "east";
																} else if (output === "east") {
																	output = turnDir === "Left" ? "north" : "south";
																} else if (output === "south") {
																	output = turnDir === "Left" ? "east" : "west";
																} else if (output === "west") {
																	output = turnDir === "Left" ? "south" : "north";
																}
															}
														}
													}

													return output;
												}

												if (solveResults && solveResults.routeResults !== undefined) {
													if (solveResults.routeResults.length) {
														routeResult = solveResults.routeResults[0];
														route = routeResult.route;
														// Add a spatial reference to the geometry.
														route.geometry.setSpatialReference(routeParams.outSpatialReference);
														route.attributes.locationId = locationId;
														route.attributes.direction = getCardinalDirection(routeResult);
														segParts = splitRouteName(route.attributes.Name);
														if (segParts) {
															if (segParts instanceof Array) {
																route.attributes.parts = segParts;
															} else {
																route.attributes.Name = [segParts.main, "from", segParts.start, "to", segParts.end].join(" ");
																route.attributes.parts = segParts;
															}
														}


														self.routeLayer.add(route);
														self._triggerRouteFound(route);
														if (isLastStop) {
															self._setTooltipStart();
															self.stopsLayer.clear();
															locationId = createLocationId();
														}
													}
												}
												self._hideBusyDialog();
											}, function (error) {
												var message = typeof (error) === "string" ? error : typeof (error) === "object" && error.message !== undefined ? error.message : "An error has occurred finding the route location.";
												self._hideBusyDialog();
												self._showMessage(message, "Error finding route");
												/*jslint devel:true*/
												if (console !== undefined && console.error !== undefined) {
													console.error(error);
												}
												/*jslint devel:false*/
											});
										} else {
											self._hideBusyDialog();
										}




										self.stopsLayer.refresh();
									}
									else {
										self._hideBusyDialog();
										self._showMessage("No intersections found at this location.");
									}
								} else {
									if (console !== undefined) {
										console.error(textStatus, data);
									}
								}
							}, "json");
						} (locationEnd));
					}
				}

				function handleRouteLayerClick(event) {
					var graphic, layer, attr;
					graphic = event.graphic;
					attr = graphic.attributes;
					if (event.type === "dblclick") {
						self._trigger("routeDoubleClicked", event, { graphic: event.graphic });
					} else {
						layer = graphic.getLayer();
						// Change the "selected" attribute.  This will determine if the renderer highlights this segment or not.
						if (attr.selected) {
							delete attr.selected;
						} else {
							attr.selected = true;
						}
						layer.refresh();
					}
				}

				$(self.element).arcGisMap({
					layers: self.options.layers,
					resizeWithWindow: self.options.resizeWithWindow,
					mapLoad: function (event, map) { // The event parameter, although not used, is necessary to match the event handler signature.  (The map parameter comes second, so another parameter needs to precede it even if it is not used.)
						var renderer;
						map.disableDoubleClickZoom();



						function setupToolbar() {
							var mapRoot = $("[id$=root]", self.element), toolbar, basemapGallery, basemapGalleryDialog;


							// Create toolbar & buttons.
							toolbar = $("<div>").addClass("ui-local-roads-selector-controls").css({
								//"text-align": "right"
								"position": "absolute",
								"top": "10px",
								"right": "10px"
							}).appendTo(mapRoot);

							// Add the address finder control.
							$("<input>").attr({
								type: "search",
								title: "Enter an intersection here and press enter to find it on the map.",
								placeholder: "Enter address or intersection"
							}).addClass("ui-corner-all").appendTo(toolbar).addressFinder({
								addressCandidateSelected: function (event, data) { // The event parameter, although not used, is necessary to match the event handler signature.  (The data parameter comes second, so another parameter needs to precede it even if it is not used.)
									var addressCandidate;
									addressCandidate = data.addressCandidate;

									map.centerAndZoom(addressCandidate.location, 15);

									map.infoWindow.setContent(addressCandidate.address).show(addressCandidate.location);
								}
							});

							// Create "Delete last segment" button.
							$("<button>").appendTo(toolbar).attr("title", "Delete the last segment added to the map").button({
								label: "Delete last segment",
								text: false,
								icons: {
									primary: "ui-icon-arrowreturnthick-1-w"
								}
							}).click(function () {
								self.deleteLastSegment();
							});

							// Create "Delete selected" button.
							$("<button>").appendTo(toolbar).attr("title", "Delete all selected segments from the map").button({
								label: "Delete selected",
								text: false,
								icons: {
									primary: "ui-icon-scissors"
								}
							}).click(function () {
								self.removeSelectedRoutes();
							});

							// Create "Clear" button.
							$("<button>").appendTo(toolbar).attr("title", "Clear all segments from the map.").button({
								label: "Clear",
								text: false,
								icons: {
									primary: "ui-icon-trash"
								}
							}).click(function () {
								self.clearSegments();
							});

							// Add basemap gallery button.
							$("<button>").appendTo(toolbar).attr("title", "Change the basemap").button({
								label: "Basemap Gallery",
								text: false,
								icons: {
									primary: "ui-icon-image"
								}
							}).click(function () {
								if (!basemapGalleryDialog) {
									basemapGalleryDialog = $("<div>").dialog({
										title: "Basemap Gallery"
									});
									basemapGallery = new esri.dijit.BasemapGallery({
										map: map
									}, basemapGalleryDialog[0]);
									basemapGallery.startup();
								} else {
									basemapGalleryDialog.dialog("open");
								}



							});
						}

						startSymbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color("green"));
						defaultSymbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color("yellow"));
						endSymbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color("red"));
						routeSymbol = new esri.symbol.SimpleLineSymbol().setWidth(5).setColor(new dojo.Color("#5555ff"));
						selectedRouteSymbol = new esri.symbol.SimpleLineSymbol().setWidth(5).setColor(new dojo.Color("#ffff00"));

						// Setup the stops layer.
						self.stopsLayer = new esri.layers.GraphicsLayer({
							id: "stops"
						});
						renderer = new esri.renderer.UniqueValueRenderer(defaultSymbol, "position");
						renderer.addValue({
							value: "start",
							symbol: startSymbol,
							label: "Start",
							description: "The start point"
						});
						renderer.addValue({
							value: "end",
							symbol: endSymbol,
							label: "End",
							description: "The end point"
						});
						self.stopsLayer.setRenderer(renderer);
						self.stopsLayer.setInfoTemplate(new esri.InfoTemplate("Address", "${Street}<br />${City}, ${State}  ${ZIP}"));

						// Setup the route layer.
						self.routeLayer = new esri.layers.GraphicsLayer({
							id: "route"
						});

						renderer = new esri.renderer.UniqueValueRenderer(routeSymbol, "selected");
						renderer.addValue({
							value: true,
							symbol: selectedRouteSymbol
						});
						self.routeLayer.setRenderer(renderer);
						// self.routeLayer.setInfoTemplate(new esri.InfoTemplate("Route", "${Name}"));
						// self.routeLayer.enableMouseEvents();

						// Add the layers to the map.
						map.addLayer(self.routeLayer);
						map.addLayer(self.stopsLayer);

						// Setup route layer events.
						dojo.connect(self.routeLayer, "onClick", handleRouteLayerClick);

						dojo.connect(self.routeLayer, "onDblClick", handleRouteLayerClick);


						// Setup mouse events.
						dojo.connect(map, "onClick", handleMapClick);
						dojo.connect(map, "onDblClick", handleMapClick);

						dojo.connect(map, "onMouseOver", function (/*event*/) {
							self._tooltip.show();
						});

						dojo.connect(map, "onMouseOut", function (/*event*/) {
							self._tooltip.hide();
						});

						dojo.connect(map, "onMouseMove", function (event) {
							// Change the position of the tooltip to match the mouse movement.
							self._tooltip.css({
								position: "absolute",
								left: event.pageX + 10,
								top: event.pageY
							});
						});


						setupToolbar();
					}
				});
			});

			return this;
		},
		_destroy: function () {
			$(this).arcGisMap("destroy");
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});

	// Add the splitRouteName function to the jQuery namespace.
	if (!$.wsdot) {
		$.wsdot = { splitRouteName: splitRouteName };
	} else {
		$.wsdot.splitRouteName = splitRouteName;
	}
} (jQuery));