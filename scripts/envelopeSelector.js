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
		_create: function () {
			var $this = this;

			$($this.element).arcGisMap({
				layers: $this.options.layers,
				resizeWithWindow: $this.options.resizeWithWindow,
				mapLoad: function (event, map) {
				}
			});

			return this;
		},
		_destroy: function () {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
} (jQuery));