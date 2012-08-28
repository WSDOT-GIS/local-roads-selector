////dojo.require("esri.symbol");
////dojo.require("esri.graphic");
////dojo.require("esri.tasks.route");
////dojo.require("esri.tasks.geometry");


(function ($) {
	"use strict";

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
			initialGraphics: null, // This will be used to have routes and segments already on the map.
			eventSpatialReference: 2927, // When events are triggered, this is the spatial reference they will be projected to.
			resizeWithWindow: true
		},
		splitRouteName: function (routeName) {
			/// <summary>Splits a route name into its four component street names.</summary>
			/// <returns type="String[]" />
			var match, streetNames, _routeNameRegex = /([^&]+)\s*&\s*([^&-]+)\s*-\s*([^&]+)\s*&\s*([^&-]+)/; // This will be used to split the segment names.
			// TODO: Create a match object and convert the captured groups into an array of strings, then return the string.
			throw new Error("Not implemented.");
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
			}
			this.stopsLayer.refresh();
			return this;
		},
		clearSegments: function () {
			this.stopsLayer.clear();
			this.routeLayer.clear();
			return this;
		},
		_geometryServiceTask: null,
		_triggerIntersectionFound: function (graphic) {
			// TODO: Project to state plane south
			this._trigger("intersectionFound", this, graphic);
		},
		_triggerRouteFound: function (graphic) {
			this._trigger("routeFound", this, graphic);
		},
		getIntersections: function (projectionCompleteFunction, projectionFailFunction) {
			// TODO: Create projected copies of intersection point graphics and return them in an array.
			var self = this, stopGeometries;
			stopGeometries = dojo.map(self.stopsLayer.graphics, function (graphic) {
				return graphic.geometry;
			});
			// console.debug(stopGeometries);
			self._geometryServiceTask.project(stopGeometries, self.options.eventSpatialReference, function (projectedPoints) {
				projectionCompleteFunction(projectedPoints);
			}, function (error) {
				if (typeof (projectionFailFunction === "function")) {
					projectionFailFunction(error);
				}
			});
		},
		getRoutes: function (projectionCompleteFunction, projectionFailFunction) {
			// TODO: Create projected copies of route polyline graphics and return them in an array.
			var self = this, routeGeometries;
			routeGeometries = dojo.map(self.routeLayer.graphics, function (graphic) {
				return graphic.geometry;
			});
			// console.debug(routeGeometries);
			self._geometryServiceTask.project(routeGeometries, self.options.eventSpatialReference, function (projectedPolylines) {
				projectionCompleteFunction(projectedPolylines);
			}, function (error) {
				if (typeof (projectionFailFunction === "function")) {
					projectionFailFunction(error);
				}
			});
		},
		_create: function () {
			var self = this, startSymbol, defaultSymbol, endSymbol, routeSymbol, routeTask;

			function init() {
				// Initialize the geometry service task.
				self._geometryServiceTask = new esri.tasks.GeometryService(self.options.geometryServiceUrl);

				function toEsriSpatialReference(srInput) {
					var type = typeof (srInput);
					// Initialize the output spatial reference.
					if (type === "number") {
						return new esri.SpatialReference({
							wkid: srInput
						});
					} else if (type === "string") {
						return new esri.SpatialReference({
							wkt: srInput
						});
					} else if ((type === "object") && (typeof (srInput.isInstanceOf) === "undefined" || !srInput.isInstanceOf(esri.SpatialReference))) {
						return new esri.SpatialReference(srInput);
					}
				}

				self.options.eventSpatialReference = toEsriSpatialReference(self.options.eventSpatialReference);

				function handleMapClick(event) {
					var location, prevGraphic;

					location = String(event.mapPoint.x) + "," + String(event.mapPoint.y);

					self._showBusyDialog("Searching for intersection...");

					$.get(self.options.reverseGeocodeHandlerUrl, {
						location: location,
						inSR: 102100,
						distance: "10",
						outSR: 102100
					}, function (data, textStatus) {
						var graphic, routeParams
						if (textStatus === "success") {
							if (data.address && data.location) {
								//// graphic = new esri.Graphic(esri.geometry.fromJson(data.location), startSymbol, data.address, new esri.InfoTemplate("Address", "${Street}<br />${City}, ${State}  ${ZIP}"));
								graphic = new esri.Graphic({
									geometry: esri.geometry.fromJson(data.location),
									attributes: data.address
								});
								graphic.attributes.Name = graphic.attributes.Street;

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
									routeParams.outSpatialReference = new esri.SpatialReference({ wkid: 102100 });

									routeTask.solve(routeParams, function (solveResults) {
										var route;
										if (solveResults && solveResults.routeResults !== undefined) {
											if (solveResults.routeResults.length) {
												route = solveResults.routeResults[0].route;
												route.geometry.spatialReference = map.spatialReference;
												self.routeLayer.add(route);
												self._triggerRouteFound(route);
											}
										}
										self._hideBusyDialog();
									}, function (error) {
										var message = typeof (error) === "string" ? error : typeof (error) === "object" && typeof (error.message) !== "undefined" ? error.message : "An error has occurred finding the route location.";
										self._hideBusyDialog();
										self._showMessage(message, "Error finding route");
										if (console !== undefined) {
											console.error(error);
										}
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
							console.error(textStatus, data);
						}
					}, "json");
				}


				$(self.element).arcGisMap({
					layers: self.options.layers,
					resizeWithWindow: self.options.resizeWithWindow,
					mapLoad: function (event, map) {
						var renderer;
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
						defaultSymbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color("yellow"))
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


						setupToolbar();
					}
				});
			}

			dojo.require("esri.symbol");
			dojo.require("esri.graphic");
			dojo.require("esri.tasks.route");
			dojo.require("esri.tasks.geometry");

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