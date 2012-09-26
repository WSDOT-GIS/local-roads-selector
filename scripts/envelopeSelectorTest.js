(function ($) {
	require(["require", "scripts/arcGisMap.js"], function (require) {
		require(["scripts/envelopeSelector.js"], function () {
			$("#map").envelopeSelector();
		});
	});
} (jQuery));