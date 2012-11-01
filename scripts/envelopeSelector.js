/// <reference path="arcGisMap.js" />
(function ($) {
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
		_drawButton: null,
		_manualButton: null,
		// Use the _setOption method to respond to changes to options
		_map: null,
		_graphicsLayer: null,
		setExtent: function (extent) {
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
		getExtent: function () {
			var graphics = this._map.graphicsLayer.graphics, extent, output, graphic;
			if (graphics.length >= 1) {
				graphic = graphics[0];
				extent = graphic.geometry;
			} else {
				output = null;
			}

			return output;
		},
		_setOption: function (key, value) {
			if (key === "selectedExtent") {
				this.setExtent(value);
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
							$this.setExtent(geometry);
						});

						// Get the map root div.
						mapRoot = $(map.root);

						buttonDiv = $("<div>").addClass("ui-envelope-selector-toolbar").appendTo(mapRoot);

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

						$this._manualButton = $("<button>").text("Manual").attr({
							type: "button",
							title: "Manual entry"
						}).appendTo(buttonDiv).button({
							icons: {
								primary: "ui-icon-calculator"
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