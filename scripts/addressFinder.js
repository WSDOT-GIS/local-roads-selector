/*globals dojo, esri, jQuery*/
/*jslint white:true, nomen:true, plusplus:true */
(function ($) {
	"use strict";
	dojo.require("esri.tasks.locator");

	function generateScoreColorCss() {
		/// <summary>Generates CSS style element that colors address candidate scored elements add adds the element to &lt;head&gt;.</summary>
		/// <returns type="jQuery">
		var i, output = $("<style>"), css;

		function generateStyle(min, max, color) {
			/// <summary>Generates a style for a range of address score classes.</summary>
			/// <param name="min" type="Number">The minimum value in the address score range.</param>
			/// <param name="max" type="Number">The maximum value in the address score range.</param>
			/// <param name="color" type="String">The color description.  E.g. "#00FF00"</param>
			/// <returns type="String" />
			var style = [];
			for (i = min; i <= max; i++) {
				if (i > min) { style.push(","); }
				style.push(".ui-address-candidate-score-" + i);
			}
			style.push(" { background-color: " + color + "; }");
			return style.join("");
		}

		css = [
			generateStyle(0, 50, "#F00"),
			generateStyle(51, 84, "#FF0"),
			generateStyle(85, 100, "#0F0")
		];

		output.text(css.join("\n")).appendTo("head");
		return output;
	}

	function init() {
		$.widget("ui.addressCandidateList", {
			options: {
				addressCandidates: null
			},
			_setOption: function (key, value) {
				var $this = this, i, l, aCandidate, list = $this._list, onMouseEnter, onMouseLeave;

				function addressCandidateSelected(event) {
					/// <summary>Triggers the addressCandidateSelected event.</summary>
					/// <param name="event" type="Object">Contains property data, which is an addressCandidate property.</param>
					var addressCandidate = event.data.addressCandidate;
					$this._trigger("addressCandidateSelected", event, { addressCandidate: addressCandidate });
				}

				onMouseEnter = function (/*event*/) {
					$(this).addClass("ui-state-hover").removeClass("ui-state-default");
				};

				onMouseLeave = function (/*event*/) {
					$(this).removeClass("ui-state-hover").addClass("ui-state-default");
				};

				if (key === "addressCandidates") {
					list.empty();
					if (value !== null && value !== undefined && value.length > 0) {
						for (i = 0, l = value.length; i < l; i++) {
							aCandidate = value[i];
							$("<li>").appendTo(list).text(aCandidate.address).addClass([
								"ui-state-default",
								"ui-address-candidate",
								"ui-address-candidate-score-" + Math.round(aCandidate.score)
							].join(" ")).click({ addressCandidate: aCandidate }, addressCandidateSelected).hover(onMouseEnter, onMouseLeave);
						}
					}
				}

				$.Widget.prototype._setOption.apply(this, arguments);
				return this;
			},
			_list: null,
			_create: function () {
				var $this = this;

				generateScoreColorCss();

				$this._list = $("<ul>").appendTo(this.element).addClass("ui-address-candidate-list");

				// Initialize the list if addressCandidates option was provided
				if ($this.options.addressCandidates !== null && $this.options.addressCandidates.length > 0) {
					$this._setOption("addressCandidates", $this.options.addressCandidates);
				}

				return this;
			},
			_destroy: function () {
				$.Widget.prototype.destroy.apply(this, arguments);
			}
		});

		$.widget("ui.addressFinder", {
			options: {
				geocoder: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Locators/TA_Streets_US_10/GeocodeServer",
				outputSpatialReference: 3857,
				searchExtent: null
			},
			_geocoder: null,
			_outputSpatialReference: null,
			_addressToLocationsDeferred: null,
			_addressCandidateList: null,
			_create: function () {
				var $this = this, inputBox;

				inputBox = $this.element;

				// Check that the element is of the correct type: input.
				inputBox.addClass("ui-address-finder").keyup(function (eventObject) {
					var address;
					if (eventObject.keyCode === 13 && $this._geocoder) { // enter key
						address = this.value;
						$(this).attr("disabled", true); // Disable the search box.  It will become re-enabled when the geocoder operation completes.
						$this._geocoder.addressToLocations({
							"Single Line Input": address
						});
					}
				});
				if (!/input/.test(inputBox[0].localName)) {
					throw new Error("Element must be 'input'.");
				}

				// Initialize the options.
				(function (names) {
					var name, i, l;
					for (i = 0, l = names.length; i < l; i += 1) {
						name = names[i];
						if ($this.options[name] !== null) {
							$this._setOption(name, $this.options[name]);
						}
					}
				} (["geocoder", "outputSpatialReference"]));

				return this;
			},
			_updateAddressCandidateList: function (addressCandidates) {
				var $this = this;
				$this.element.attr("disabled", null);
				if (addressCandidates.length <= 1) {
					if ($this._addressCandidateList !== null) {
						$this._addressCandidateList.dialog("close");
					}
					if (addressCandidates.length === 1) {
						// Trigger address selected event.
						$this._trigger("addressCandidateSelected", null, { addressCandidate: addressCandidates[0] });
					}
				} else if (addressCandidates.length > 1) {
					// Create address candidate list.
					if ($this._addressCandidateList === null) {
						$this._addressCandidateList = $("<div>").addressCandidateList({
							addressCandidates: addressCandidates,
							addressCandidateSelected: function (event) {
								$this._trigger("addressCandidateSelected", event, event.data.addressCandidate);
							}
						}).dialog();
					} else {
						$this._addressCandidateList.addressCandidateList("option", "addressCandidates", addressCandidates).dialog("open");
					}
				}
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

					// Set the spatial reference of the geocoder if it exists.
					if ($this._geocoder) {
						$this._geocoder.setOutSpatialReference($this._outputSpatialReference);
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

					// If an output spatial reference has been defined, set the geocoder to match.
					if ($this._outputSpatialReference) {
						$this._geocoder.setOutputSpatialReference($this._outputSpatialReference);
					}

					// Disconnect existing events.
					if (this._addressToLocationsDeferred) {
						dojo.disconnect(this._addressToLocationsDeferred);
						this._addressToLocationsDeferred = null;
					}
					// Connect new events.
					this._addressToLocationsDeferred = dojo.connect(this._geocoder, "onAddressToLocationsComplete", $this, function (addressCandidates) {
						$this._updateAddressCandidateList(addressCandidates);
					});
				}
				$.Widget.prototype._setOption.apply(this, arguments);
				return this;
			},
			_destroy: function () {
				$.Widget.prototype.destroy.apply(this, arguments);
			}
		});
	}

	dojo.addOnLoad(init);
} (jQuery));