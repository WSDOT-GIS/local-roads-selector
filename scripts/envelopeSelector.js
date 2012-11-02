/*global jQuery, require, dojo, esri, Proj4js*/
/*jslint nomen:true*/

/// <reference path="arcGisMap.js" />
/// <reference path="proj4js/proj4js-combined.js" />
/// <reference path="proj4js/defs/EPSG2927.js" />
/// <reference path="proj4js/defs/EPSG3857.js" />
/// <reference path="clientProjection.js" />

(function ($) {
	"use strict";

	var projection, mapProjection;

	// Define the projections used by the CIA database and by the map, repsectively.
	projection = new Proj4js.Proj("EPSG:2927");
	mapProjection = new Proj4js.Proj("EPSG:3857");

	// Define the manual entry dialog widget.
	$.widget("ui.envelopeEntryDialog", $.ui.dialog, {
		options: {
			selectedExtent: null,
			boundingExtent: null,
			title: "Enter Coordinates",
			modal: true,
			buttons: [
				{
					text: "OK",
					title: "Set envelope to entered coordinates",
					click: function () {
						$(this).envelopeEntryDialog("close");
					}
				},
				{
					text: "Cancel",
					title: "Exit this dialog without setting coordinates",
					click: function () {
						$(this).envelopeEntryDialog("close");
					}
				}
			]
		},
		_xMinBox: null,
		_yMinBox: null,
		_xMaxBox: null,
		_yMaxBox: null,
		_create: function () {
			var $this = this;



			$("<p>").text("Coordinates are in WA State Plane South (2927)").appendTo($this.element);
			$("<label>X Min.</label>").appendTo($this.element);
			$this._xMinBox = $("<input type='text' placeholder='x min'>").appendTo($this.element).spinner();
			$("<br />").appendTo($this.element);
			$("<label>Y Min.</label>").appendTo($this.element);
			$this._yMinBox = $("<input type='text' placeholder='y min'>").appendTo($this.element).spinner();
			$("<br />").appendTo($this.element);
			$("<label>X Max.</label>").appendTo($this.element);
			$this._xMaxBox = $("<input type='text' placeholder='x max'>").appendTo($this.element).spinner();
			$("<br />").appendTo($this.element);
			$("<label>Y Max.</label>").appendTo($this.element);
			$this._yMaxBox = $("<input type='text' placeholder='y max'>").appendTo($this.element).spinner();

			$this._super(arguments);

			// Add icons to dialog buttons.
			(function (buttons) {
				buttons.eq(0).button("option", "icons", { primary: "ui-icon-check" });
				buttons.eq(1).button("option", "icons", { primary: "ui-icon-close" });
			} ($(".ui-dialog-buttonset > button", $this.element.parent()).button("option", "text", false)));

			return this;
		},
		_setOption: function (key, value) {
			var $this = this;
			if (key === "selectedExtent") {
			} else if (key === "boundingExtent") {
				// If no spatial reference is specified, assume 2927.
				if (!value.spatialReference || value.spatialReference.wkid !== 2927) {
				}
				$this._xMinBox.spinner({

				});
			}
			this._superApply(arguments);
		},
		_destroy: function () {
			this._super(arguments);
			//$.Widget.prototype.destroy.apply(this, arguments);
		}
	});

	$.widget("ui.envelopeSelector", {
		options: {
			layers: [
					{
						url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/",
						type: "esri.layers.ArcGISTiledMapServiceLayer"
					}
			],
			resizeWithWindow: true
		},
		_manualDialog: null,
		_drawButton: null,
		_manualButton: null,
		_clearButton: null,
		_map: null,
		_graphicsLayer: null,
		_setExtent: function (extent) {
			var $this = this;

			// TODO: Get pre-change extent.  Trigger an extent change event that has previous and current extent arguments.

			// Create the graphics layer if it does not already exist.
			if ($this._graphicsLayer) {
				$this._graphicsLayer.clear();
			} else {
				$this._graphicsLayer = new esri.layers.GraphicsLayer();
				$this._graphicsLayer.setRenderer(new esri.renderer.SimpleRenderer(new esri.symbol.SimpleLineSymbol()));
				$this._map.addLayer($this._graphicsLayer);
			}

			if (extent) {
				// TODO: Detect spatial reference system.  Perform conversion if necessary.
				$this._graphicsLayer.add(new esri.Graphic(extent));
			}

			return this;
		},
		_getExtent: function (project) {
			/// <summary>Gets the currently selected extent from the graphics layer.</summary>
			/// <param name="project" type="Boolean">
			/// Set this value to true to project to WA State Plane South (2927).
			/// Set to false (or a "falsey" value, e.g., null or undefined) to return unprojected (Web Mercator Aux. Sphere, 3857).
			/// </param>
			var graphics = this._map.graphicsLayer.graphics, extent, output, graphic;
			if (graphics.length >= 1) {
				graphic = graphics[0];
				extent = graphic.geometry;
			} else {
				output = null;
			}

			return output;
		},
		// Use the _setOption method to respond to changes to options
		_setOption: function (key, value) {
			if (key === "selectedExtent") {
				this._setExtent(value);
			}
			// In jQuery UI 1.8, you have to manually invoke the _setOption method from the base widget
			$.Widget.prototype._setOption.apply(this, arguments);
		},
		_isDrawing: false,
		_create: function () {
			var $this = this;

			require(["esri/toolbars/draw"], function () {
				$($this.element).arcGisMap({
					layers: $this.options.layers,
					resizeWithWindow: $this.options.resizeWithWindow,
					mapLoad: function (event, map) {
						var mapRoot, buttonDiv, drawToolbar;

						function styleDrawButton() {
							/// <summary>Changes the appearance of the draw button between draw mode and cancel mode.</summary>
							if (!$this._isDrawing) {
								$this._drawButton.button({
									label: "Draw Box",
									icons: {
										primary: "ui-icon-pencil"
									}
								});
							} else {
								$this._drawButton.button({
									label: "Cancel Drawing",
									icons: {
										primary: "ui-icon-close"
									}
								});
							}
						}

						$this._map = map;

						drawToolbar = new esri.toolbars.Draw(map);
						dojo.connect(drawToolbar, "onDrawEnd", function (geometry) {
							drawToolbar.deactivate();
							$this._isDrawing = false;
							styleDrawButton();
							$this._setExtent(geometry);
						});

						// Get the map root div.
						mapRoot = $(map.root);

						buttonDiv = $("<div>").addClass("ui-envelope-selector-toolbar").appendTo(mapRoot);

						// Setup the draw button.
						$this._drawButton = $("<button>").text("Draw Box").attr({
							type: "button",
							title: "Draw Box"
						}).appendTo(buttonDiv).button({
							text: false,
							icons: {
								primary: "ui-icon-pencil"
							}
						}).click(function () {
							if (!$this._isDrawing) {
								// Set the widget to draw mode.
								drawToolbar.activate(esri.toolbars.Draw.EXTENT);
								$this._isDrawing = true;
								styleDrawButton();
							} else {
								// Cancel the drawing.
								drawToolbar.deactivate();
								$this._isDrawing = false;
								styleDrawButton();
							}
						});

						// Setup the manual entry button.
						$this._manualButton = $("<button>").text("Manual").attr({
							type: "button",
							title: "Manual entry"
						}).appendTo(buttonDiv).button({
							text: false,
							icons: {
								primary: "ui-icon-calculator"
							}
						}).click(function () {
							if (!$this._manualDialog) {
								$this._manualDialog = $("<div>").envelopeEntryDialog();
							} else {
								$this._manualDialog.envelopeEntryDialog("open");
							}
						});

						$this._clearButton = $("<button type='button'>Clear</button>").appendTo(buttonDiv).button({
							text: false,
							icons: {
								primary: "ui-icon-trash"
							}
						}).click(function () {
							$this._setOption("selectedExtent", null);
						});


					}
				});
			});

			return this;
		},
		_destroy: function () {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
} (jQuery));