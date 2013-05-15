/*global jQuery*/

(function ($) {
	"use strict";
	$(document).ready(function () {
		$("#map").envelopeSelector({
			mapLoad: function () {
				console.log(arguments);
			}
		});
	});
} (jQuery));