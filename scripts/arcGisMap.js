/*jslint windows: true, devel: true, browser: true, white: true, nomen: true, maxerr: 50, indent: 4 */
/*global jQuery, dojo, esri */
/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.2-vsdoc.js" />
/// <reference path="http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.15/jquery-ui.js"/>
/// <reference path="jsapi_vsdoc_v31.js" />

(function ($) {
	"use strict";

	$.widget("ui.arcGisMap", {
		options: {
			extent: { "xmin": -14402710.641319368, "ymin": 5436246.03029616, "xmax": -12445922.717219383, "ymax": 6479458.5923319645, "spatialReference": { "wkid": 102100} },
			layers: [
				{
					url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
					type: "esri.layers.ArcGISTiledMapServiceLayer"
				}
			], // layers: An array of objects that defines a "type" of layer, a "url", and (optionally) "options". 
			logo: true,
			wrapAround180: false,
			resizeWithWindow: false
		},
		_map: null,
		getMap: function () {
			/// <summary>Returns the ArcGIS JavaScript API esri.Map object.</summary>
			return this._map;
		},
		getMapProperty: function (propertyName) {
			///<summary>Gets a property from the underlying esri.Map object.</summary>
			return this._map[propertyName];
		},
		setMapProperty: function (propertyName, value) {
			///<summary>Sets the value of a property of the underlying esri.Map object.</summary>
			this._map[propertyName] = value;
		},
		connectMapEvent: function (eventName, handler) {
			return dojo.connect(this._map, eventName, handler);
		},
		callMapFunction: function (functionName) {
			///<summary>Calls a function of the underlying esri.Map object.</summary>
			///<param name="functionName">The name of the function.</param>
			// Convert the arguments into an array.
			var args, argumentsArray = Array.prototype.slice.call(arguments);
			// Get the arguments, excluding the function name (the first arg.).
			args = argumentsArray.slice(1);
			// Call the specified function, passing in the other arguments.
			if (this._map) {
				return this._map[functionName].apply(this._map, args);
			}
		},
		_create: function () {
			var self = this, resizeTimer;

			/// <summary>Initializes the creation of the map control.</summary>
			function getLayerConstructor(layerType) {
				///<summary>Returns a constructor for a specific type of layer.</summary>
				if (typeof (layerType) === "string") {
					if (/(?:esri\.layers\.)?ArcGISTiledMapServiceLayer/i.test(layerType)) {
						return esri.layers.ArcGISTiledMapServiceLayer;
					} else if (/(?:esri\.layers\.)?ArcGISDynamicMapServiceLayer/i.test(layerType)) {
						return esri.layers.ArcGISDynamicMapServiceLayer;
					} else if (/(?:esri\.layers\.)?ArcGISImageServiceLayer/i.test(layerType)) {
						return esri.layers.ArcGISImageServiceLayer;
					} else if (/(?:esri\.layers\.)?FeatureLayer/i.test(layerType)) {
						return esri.layers.FeatureLayer;
					} else if (/(?:esri\.layers\.)?KMLLayer/i.test(layerType)) {
						return esri.layers.KMLLayer;
					} else {
						throw new Error("Unsupported layer type.");
					}
				} else if (typeof (layerType) === "function") {
					return layerType;
				}
			}

			function createLayer(layerDef) {
				var constructor = getLayerConstructor(layerDef.type);
				return constructor(layerDef.url, layerDef.options);
			}

			require(["esri/map"], function () {

				// Set the extent option to an Extent object if it is not already.
				if (self.options.extent && (!self.options.extent.isInstanceOf || !self.options.extent.isInstanceOf(esri.geometry.Extent))) {
					self.options.extent = new esri.geometry.Extent(self.options.extent);
				}

				// Create the map object.
				self._map = new esri.Map(self.element[0], {
					extent: self.options.extent,
					logo: self.options.logo,
					wrapAround180: self.options.wrapAround180
				});

				// Trigger this widget's mapLoad event when the map objects onLoad event occurs.
				dojo.connect(self._map, "onLoad", function (map) {
					// Trigger this widget's map load event.
					self._trigger("mapLoad", this.element, map);
				});

				// For each of the layer definitions, create the layer and then add it to the map.
				dojo.forEach(self.options.layers, function (layerDef) {
					var layer;
					// Try to create the layer.  If an error occurs, trigger an event and go to the next layer definition.
					try {
						layer = createLayer(layerDef);
					} catch (e) {
						self._trigger("layerCreateError", self, {
							layerDef: layerDef,
							error: e
						});
						return;
					}

					// Try to add the new layer to the map.  If that fails, trigger an event.
					try {
						self._map.addLayer(layer);
					} catch (e2) {
						self._trigger("layerAddError", self, {
							layerDef: layerDef,
							error: e2
						});
					}
				});

				if (self.options.resizeWithWindow) {
					//resize the map when the browser resizes - view the 'Resizing and repositioning the map' section in 
					//the following help topic for more details http://help.esri.com/EN/webapi/javascript/arcgis/help/jshelp_start.htm#jshelp/inside_guidelines.htm
					dojo.connect(self._map, 'onLoad', function (map) {
						dojo.connect(window, "resize", function () {  //resize the map if the div is resized
							clearTimeout(resizeTimer);
							resizeTimer = setTimeout(function () {
								map.resize();
								map.reposition();
							}, 500);
						});
					});
				}

				self._map.resize();
			});

			return self;
		},
		_destroy: function () {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
} (jQuery));