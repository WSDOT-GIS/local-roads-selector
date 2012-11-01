/*global jQuery, require, dojo, esri*/
/*jslint nomen:true*/

/// <reference path="arcGisMap.js" />
(function ($) {
	"use strict";

	$.widget("ui.envelopeEntryDialog", $.ui.dialog, {
		options: {
			envelope: null,
			title: "Enter Coordinates",
			buttons: {
				"OK": function () {
					$(this).envelopeEntryDialog("close");
				},
				"Cancel": function () {
					$(this).envelopeEntryDialog("close");
				}
			}
		},
		_xMinBox: null,
		_yMinBox: null,
		_xMaxBox: null,
		_yMaxBox: null,
		_create: function () {
			var $this = this;

			$("<label>X Min.</label>").appendTo($this.element);
			$this._xMinBox = $("<input type='number' placeholder='x min'>").appendTo($this.element);
			$("<br />").appendTo($this.element);
			$("<label>Y Min.</label>").appendTo($this.element);
			$this._yMinBox = $("<input type='number' placeholder='y min'>").appendTo($this.element);
			$("<br />").appendTo($this.element);
			$("<label>X Max.</label>").appendTo($this.element);
			$this._xMaxBox = $("<input type='number' placeholder='x max'>").appendTo($this.element);
			$("<br />").appendTo($this.element);
			$("<label>Y Max.</label>").appendTo($this.element);
			$this._yMaxBox = $("<input type='number' placeholder='y max'>").appendTo($this.element);


			this._super(arguments);

			return this;
		},
		_setOption: function (key, value) {
			if (key === "envelope") {

			}
			this._superApply(arguments);
		},
		_destroy: function () {
			$.Widget.prototype.destroy.apply(this, arguments);
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
		_map: null,
		_graphicsLayer: null,
		_setExtent: function (extent) {
			var $this = this;

			if (extent) {
				if ($this._graphicsLayer) {
					$this._graphicsLayer.clear();
				} else {
					$this._graphicsLayer = new esri.layers.GraphicsLayer();
					$this._graphicsLayer.setRenderer(new esri.renderer.SimpleRenderer(new esri.symbol.SimpleLineSymbol()));
					$this._map.addLayer($this._graphicsLayer);
				}

				$this._graphicsLayer.add(new esri.Graphic(extent));
			}

			return this;
		},
		_getExtent: function () {
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
							icons: {
								primary: "ui-icon-calculator"
							},
						}).click(function () {
							if (!$this._manualDialog) {
								$this._manualDialog = $("<div>").envelopeEntryDialog();
							} else {
								$this._manualDialog.envelopeEntryDialog("open");
							}
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