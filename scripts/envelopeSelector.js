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
		setExtent: function (extent) {
			var $this = this, graphicsLayer = this._map.graphicsLayer;

			graphicsLayer.clear();

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
				this._drawExtent(value);
			}
			// In jQuery UI 1.8, you have to manually invoke the _setOption method from the base widget
			$.Widget.prototype._setOption.apply(this, arguments);
		},
		_create: function () {
			var $this = this;

			$($this.element).arcGisMap({
				layers: $this.options.layers,
				resizeWithWindow: $this.options.resizeWithWindow,
				mapLoad: function (event, map) {
					var mapRoot, buttonDiv;

					$this._map = map;

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

			return this;
		},
		_destroy: function () {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
} (jQuery));