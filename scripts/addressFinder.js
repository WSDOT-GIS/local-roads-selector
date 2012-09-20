/*globals dojo, esri, jQuery*/
/*jslint white:true, nomen:true*/
(function ($) {
	"use strict";
	dojo.require("esri.tasks.locator");

	function init() {
		$.widget("ui.addressFinder", {
			options: {
				geocoder: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Locators/TA_Streets_US_10/GeocodeServer",
				outputSpatialReference: null
			},
			_geocoder: null,
			_outputSpatialReference: null,
			_addressToLocationsDeferred: null,
			_create: function () {
				var $this = this, inputBox;

				inputBox = $this.element;
				if (!/input/.test(inputBox.localName)) {
					throw new Error("Element must be 'input'.");
				}

				return this;
			},
			_setOption: function (key, value) {
				var $this = this;
				if (key === 'outputSpatialReference') {
					if (typeof (value) === 'number') {
						$this._outputSpatialReference = new esri.SpatialReference({ wkid: value });
					} else if (typeof (value) === 'string') {
						$this._outputSpatialReference = new esri.SpatialReference({ wkt: value });
					} else if (value.isInstanceOf !== undefined && value.isInstanceOf(esri.SpatialReference)) {
						$this._outputSpatialReference = value;
					}
				}
				else if (key === 'geocoder') {
					if (typeof (value) === "string") {
						this._geocoder = new esri.tasks.Locator(value);
					} else if (value.isInstanceOf !== undefined && value.isInstanceOf(esri.tasks.Locator)) {
						this._geocoder = value;
					} else {
						throw new Error("Invalid type assigned to geocoder option.");
					}

					// Disconnect existing events.
					if (this._addressToLocationsDeferred) {
						dojo.disconnect(this._addressToLocationsDeferred);
						this._addressToLocationsDeferred = null;
					}
					// Connect new events.
					this._addressToLocationsDeferred = dojo.connect(this._geocoder, "onAddressToLocationsComplete", $this, function (addressCandidates) {
						// $this._trigger('addressToLocationsComplete', event, { addressCandidates: addressCandidates });

					});
				}
				$.Widget.prototype._setOption.apply(this, arguments);
			},
			_destroy: function () {
				$.Widget.prototype.destroy.apply(this, arguments);
			}
		});
	}

	dojo.addOnLoad(init);
} (jQuery));