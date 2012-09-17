/** Copyright 2012 Washington State Department of Transportation.  Licensed under The MIT License (http://opensource.org/licenses/MIT). **/
/*global esri, dojo, jQuery*/
/*jslint nomen: true, regexp: true, white:true */
/// <reference path="jsapi_vsdoc_v31.js" />


(function ($) {
	"use strict";

	function createLocationId() {
		return new Date().getTime();
	}

	function copyGeometriesWithNewGraphics(graphics, geometries) {
		/// <summary>Creates copies of the input graphics.  The geometries will of the copies be replaced with those from "geometries"</summary>
		/// <param name="graphics" type="esri.Graphic[]">An array of graphics.</param>
		/// <param name="geometries" type="esri.geometry.Geometry[]">An array of geometries.</param>
		/// <returns type="esri.Graphic[]" />
		var output, i, l, graphic;
		output = [];
		if (graphics.length !== geometries.length) {
			throw new Error('The "graphics" and "geometries" arrays should have the same number of elements."');
		}

		for (i = 0, l = graphics.length; i < l; i += 1) {
			graphic = graphics[i].toJson();
			graphic.geometry = geometries[i];
			if (esri) {
				graphic = new esri.Graphic(graphic);
			}
			output.push(graphic);
		}

		return output;
	}

	function splitRouteName(routeName) {
		/// <summary>Splits a route name into its four component street names.</summary>
		/// <returns type="Object">An object with the following properties: main, start, and end.</returns>
		var match, streetNames, _routeNameRegex = /^([^\-&]+?)\s*&\s*([^\-&]+?)\s*-\s*([^\-&]+?)\s*&\s*([^\-&]+)$/i; // This will be used to split the segment names.

		function findMainStreetName(streetNames) {
			/// <summary>Compares the list of street names and determines which is the main street.  This will be the street name that is included in the array twice.</summary>
			/// <param name="streetNames" type="String[]">An array containing five strings.</param>
			/// <returns type="Object" />

			var i, j, main, output = null;
			/*jslint plusplus:true*/
			for (i = 1; i <= 2; i++) {
				for (j = 3; j <= 4; j++) {
					if (streetNames[i] === streetNames[j]) {
						main = streetNames[i];
						break;
					}
				}
				if (main) {
					break;
				}
			}
			/*jslint plusplus:false*/

			if (main) {
				output = {
					main: main,
					start: i === 1 ? streetNames[2] : streetNames[1],
					end: j === 3 ? streetNames[4] : streetNames[3]
				};
			}

			return output;
		}

		match = _routeNameRegex.exec(routeName);

		if (match) {
			streetNames = findMainStreetName(match);
			if (!streetNames) {
				streetNames = match;
			}
		} else {
			streetNames = null;
		}

		return streetNames;
	}



	$.fn.splitRouteName = splitRouteName;

	$.widget("ui.localRoadsSelector", {
		options: {
			reverseGeocodeHandlerUrl: "../ReverseGeocodeIntersection.ashx",
			routeTaskUrl: "http://tasks.arcgisonline.com/ArcGIS/rest/services/NetworkAnalysis/ESRI_Route_NA/NAServer/Route",
			geometryServiceUrl: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer",
			layers: [
					{
						url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/",
						type: "esri.layers.ArcGISTiledMapServiceLayer"
					}
			],
			// This will be used to have routes and segments already on the map.  This should be JSON that can be used to initialize a feature set.
			initialGraphics: null,

			eventSpatialReference: 2927, // When events are triggered, this is the spatial reference they will be projected to.
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
			this.stopsLayer.clear();
			this.routeLayer.clear();
			this._setTooltipStart();
			return this;
		},
		_geometryServiceTask: null,
		_triggerIntersectionFound: function (graphic) {
			this._trigger("intersectionFound", this, graphic);
		},
		_triggerRouteFound: function (graphic) {
			this._trigger("routeFound", this, graphic);
		},
		getIntersections: function (projectionCompleteFunction, projectionFailFunction) {
			// Create projected copies of intersection point graphics and return them in an array.
			var self = this, stopGeometries;
			stopGeometries = self.stopsLayer.graphics.length < 1 ? [] : esri.getGeometries(self.stopsLayer.graphics);

			if (stopGeometries.length > 0) {
				self._geometryServiceTask.project(stopGeometries, self.options.eventSpatialReference, function (projectedPoints) {
					var outFeatures = copyGeometriesWithNewGraphics(self.stopsLayer.graphics, projectedPoints);
					projectionCompleteFunction(outFeatures);
				}, function (error) {
					if (typeof (projectionFailFunction === "function")) {
						projectionFailFunction(error);
					}
				});
			} else {
				projectionCompleteFunction([]);
			}
		},
		getRoutes: function (projectionCompleteFunction, projectionFailFunction) {
			// Create projected copies of route polyline graphics and return them in an array.
			var self = this, routeGeometries;
			routeGeometries = self.routeLayer.graphics.length > 0 ? esri.getGeometries(self.routeLayer.graphics) : [];

			if (routeGeometries.length > 0) {
				self._geometryServiceTask.project(routeGeometries, self.options.eventSpatialReference, function (projectedPolylines) {
					var outFeatures = copyGeometriesWithNewGraphics(self.routeLayer.graphics, projectedPolylines);
					projectionCompleteFunction(outFeatures);
				}, function (error) {
					if (typeof (projectionFailFunction === "function")) {
						projectionFailFunction(error);
					}
				});
			} else {
				projectionCompleteFunction([]);
			}
		},

		_create: function () {
			var self = this, startSymbol, defaultSymbol, endSymbol, routeSymbol, routeTask, locationId = createLocationId();

			self._tooltip = $("<div>").addClass("ui-local-roads-selector-tooltip").hide().appendTo("body");
			self._setTooltipStart();

			function init() {
				// Initialize the geometry service task.
				self._geometryServiceTask = new esri.tasks.GeometryService(self.options.geometryServiceUrl);

				function toEsriSpatialReference(srInput) {
					var type = typeof (srInput), output;
					// Initialize the output spatial reference.
					if (type === "number") {
						output = new esri.SpatialReference({
							wkid: srInput
						});
					} else if (type === "string") {
						output = new esri.SpatialReference({
							wkt: srInput
						});
					} else if ((type === "object") && (srInput.isInstanceOf === undefined || !srInput.isInstanceOf(esri.SpatialReference))) {
						output = new esri.SpatialReference(srInput);
					}

					return output;
				}

				self.options.eventSpatialReference = toEsriSpatialReference(self.options.eventSpatialReference);

				function handleMapClick(event) {
					var location, prevGraphic, locationEnd = event.type === "dblclick";

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
										routeParams.returnDirections = false;
										routeParams.directionLengthUnits = esri.Units.MILES;
										// TODO: Get spatial reference from map instead of creating a new object.
										routeParams.outSpatialReference = new esri.SpatialReference({ wkid: 102100 });

										routeTask.solve(routeParams, function (solveResults) {
											var route, segParts;
											if (solveResults && solveResults.routeResults !== undefined) {
												if (solveResults.routeResults.length) {
													route = solveResults.routeResults[0].route;
													// Add a spatial reference to the geometry.
													route.geometry.setSpatialReference(routeParams.outSpatialReference);
													route.attributes.locationId = locationId;

													segParts = splitRouteName(route.attributes.Name);
													if (segParts) {
														if (segParts instanceof Array) {
															route.attributes.parts = segParts;
														} else {
															route.attributes.Name = [segParts.main, "from", segParts.start, "to", segParts.end].join(" ");
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
											if (console !== undefined) {
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


				$(self.element).arcGisMap({
					layers: self.options.layers,
					resizeWithWindow: self.options.resizeWithWindow,
					mapLoad: function (event, map) {
						var renderer;
						map.disableDoubleClickZoom();



						function setupToolbar() {
							var mapRoot = $("[id$=root]", self.element);
							// Create toolbar & buttons.
							$("<div>").addClass("ui-local-roads-selector-controls").css({
								"text-align": "right"
							}).appendTo(mapRoot);

							// Create "Delete last segment" button.
							$("<button>").appendTo(".ui-local-roads-selector-controls").attr("title", "Delete the last segment added to the map").button({
								label: "Delete last segment"
							}).click(function () {
								self.deleteLastSegment();
							});

							// Create "Clear" button.
							$("<button>").appendTo(".ui-local-roads-selector-controls").attr("title", "Clear all segments from the map.").button({
								label: "Clear"
							}).click(function () {
								self.clearSegments();
							});
						}

						startSymbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color("green"));
						defaultSymbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color("yellow"));
						endSymbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color("red"));
						routeSymbol = new esri.symbol.SimpleLineSymbol();

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
						renderer = new esri.renderer.SimpleRenderer(routeSymbol);
						self.routeLayer.setRenderer(renderer);
						self.routeLayer.setInfoTemplate(new esri.InfoTemplate("Route", "${Name}"));

						// Add the layers to the map.
						map.addLayer(self.routeLayer);
						map.addLayer(self.stopsLayer);


						dojo.connect(map, "onClick", handleMapClick);
						dojo.connect(map, "onDblClick", handleMapClick);

						dojo.connect(map, "onMouseOver", function (/*event*/) {
							self._tooltip.show();
						});

						dojo.connect(map, "onMouseOut", function (/*event*/) {
							self._tooltip.hide();
						});

						dojo.connect(map, "onMouseMove", function (event) {
							self._tooltip.css({
								position: "absolute",
								left: event.pageX + 10,
								top: event.pageY
							});
						});


						setupToolbar();

						// Add initial graphics if provided
						if (self.options.initialGraphics && self.options.initialGraphics.length > 0) {
							(function (graphics) {
								var i, l, graphic;
								for (i = 0, l = graphics.length; i < l; i += 1) {
									try {
										graphic = graphics[i];
										graphic = new esri.Graphic(graphic);
										if (graphic.geoemtry.type === "polyline") {
											self.routeLayer.add(graphic);
										}
									} catch (e) {
										if (console !== undefined) {
											console.error(["Error adding initial graphic #", i, "."].join(""), e);
										}
									}
								}
							} (self.options.initialGraphics));
						}
					}
				});
			}

			dojo.require("esri.symbol");
			dojo.require("esri.graphic");
			dojo.require("esri.tasks.route");
			dojo.require("esri.tasks.geometry");
			dojo.require("ogc.SimpleGeometry");

			dojo.addOnLoad(function () {
				init();
			});

			return this;
		},
		_destroy: function () {
			$(this).arcGisMap("destroy");
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
} (jQuery));