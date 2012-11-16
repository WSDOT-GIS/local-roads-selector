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

	function webMercatorToStatePlaneSouth(geometry) {
		/// <summary>Projects geometry from web mercator aux. sphere to WA state plane south.</summary>
		/// <param name="geometry" type="esri.geometry.Geometry">A geometry object.</param>
		/// <returns type="esri.geometry.Geometry" />
		var output = null;

		if (!geometry) {
			output = null;
		} else if (!geometry.spatialReference) {
			throw new Error("Cannot project.  Property spatialReference does not exist.");
		}

		if (geometry.spatialReference.wkid === 2927) {
			output = geometry;
		} else if (geometry.spatialReference.wkid === 3857 || geometry.spatialReference.wkid === 102100) {
			output = Proj4js.projectEsriGeometry(geometry, mapProjection, projection);
		} else {
			throw new Error("Unsupported source spatial reference.");
		}

		return output;
	}

	function statePlaneSouthToWebMercator(geometry) {
		/// <summary>Projects geometry from web mercator aux. sphere to WA state plane south.</summary>
		/// <param name="geometry" type="esri.geometry.Geometry">A geometry object.</param>
		/// <returns type="esri.geometry.Geometry" />
		var output;

		if (!geometry) {
			output = null;
		} else if (!geometry.spatialReference) {
			throw new Error("Cannot project.  Property spatialReference does not exist.");
		} else if (geometry.spatialReference.wkid === 2927) {
			output = Proj4js.projectEsriGeometry(geometry, projection, mapProjection);
		} else if (geometry.spatialReference.wkid === 3857 || geometry.spatialReference.wkid === 102100) {
			output = geometry;
		} else {
			throw new Error("Unsupported source spatial reference.");
		}

		return output;
	}

	// Define the manual entry dialog widget.
	$.widget("ui.envelopeEntryDialog", $.ui.dialog, {
		options: {
			selectedExtent: null,
			title: "Enter Coordinates",
			modal: true,
			buttons: [
				{
					text: "OK",
					title: "Set envelope to entered coordinates",
					click: function (/*event*/) {
						var $this, xmin, ymin, xmax, ymax, envelope;

						function getNumberOrNull(value) {
							var output;
							output = value ? Number(value) : null;
							return output;
						}

						$this = $(this).data("envelopeEntryDialog");
						xmin = getNumberOrNull($this._xMinBox.val());
						ymin = getNumberOrNull($this._yMinBox.val());
						xmax = getNumberOrNull($this._xMaxBox.val());
						ymax = getNumberOrNull($this._yMaxBox.val());

						// Create the envelope object.  Set to null if the values are not specified.
						envelope = xmin === null || ymin === null || xmax === null || ymax === null ? null : {
							xmin: xmin,
							ymin: ymin,
							xmax: xmax,
							ymax: ymax,
							spatialReference: {
								wkid: 2927
							}
						};

						if (envelope) {
							$this.option("selectedExtent", envelope);
						}

						// $this.close();
						$this._form.submit();
					}
				},
				{
					text: "Cancel",
					title: "Exit this dialog without setting coordinates",
					click: function () {
						var $this = $(this).data("envelopeEntryDialog");
						$this.close();
					}
				}
			]
		},
		_xMinBox: null,
		_yMinBox: null,
		_xMaxBox: null,
		_yMaxBox: null,
		_form: null,
		_create: function () {
			var $this = this, thisId;
			// Setup an id to use as a base for child control ids.
			thisId = this.id || "envelopeSelector" + new Date().getTime();

			$this.element.addClass("ui-envelope-entry-dialog");

			function createControlAndLabel(idSuffix, label, name, placeholder) {
				/// <summary>Creates a number input control and associated label.</summary>
				/// <param name="idSuffix" type="String">A suffix that will be used to create the input box's ID.</param>
				/// <param name="label" type="String">The text of the label.</param>
				/// <param name="placeholder" type="String">The text of the input box's placeholder attribute.  If omitted, the label parameter will be used.</param>
				/// <returns type="jQuery">The created input box.</returns>
				var div, id;
				id = thisId + idSuffix;
				div = $("<div>").appendTo($this._form);
				$("<label>").text(label).attr("for", id).appendTo(div);
				return $("<input>").attr({
					type: "text", //"number",
					name: name || idSuffix,
					// required: true,
					placeholder: placeholder || label,
					id: id
				}).addClass("number required").appendTo(div);
			}

			$this._form = $("<form>").attr({
				action: "#",
				id: thisId + "form",
				method: "GET"
			}).appendTo($this.element).submit(function () {
				$this.close();
				return false;
			});


			$("<p>").text("Coordinates are in WA State Plane South (2927)").appendTo($this._form);

			$this._xMinBox = createControlAndLabel("XMin", "X Min.");
			$this._yMinBox = createControlAndLabel("YMin", "Y Min.");
			$this._xMaxBox = createControlAndLabel("XMax", "X Max.");
			$this._yMaxBox = createControlAndLabel("YMax", "Y Max.");

			// Sync. the input boxes with the initially specified selected extent.
			if ($this.options.selectedExtent) {
				$this._setOption("selectedExtent", $this.options.selectedExtent);
			}

			$this._super(arguments);

			// Add icons to dialog buttons.
			(function (buttons) {
				buttons.eq(0).button("option", "icons", { primary: "ui-icon-check" });
				buttons.eq(1).button("option", "icons", { primary: "ui-icon-close" });
			} ($(".ui-dialog-buttonset > button", $this.element.parent()).button("option", "text", false)));

			$this._form.validate({
				submitHandler: function (/*form*/) {
					$this.close();
				}
			});

			return this;
		},
		_setOption: function (key, value) {
			var $this = this, envelope;
			if (key === "selectedExtent") {
				if (value) {
					// Project if necessary.
					envelope = webMercatorToStatePlaneSouth(value);
					$this.options[key] = envelope;

					// Set the text boxes.
					$this._xMinBox.val(envelope.xmin);
					$this._yMinBox.val(envelope.ymin);
					$this._xMaxBox.val(envelope.xmax);
					$this._yMaxBox.val(envelope.ymax);
				} else {
					// Nullify the boxes.
					$this.options[key] = null;
					$this._xMinBox.val("");
					$this._yMinBox.val("");
					$this._xMaxBox.val("");
					$this._yMaxBox.val("");
				}


				$this._trigger("extentSelect", null, {
					envelope: value
				});
			}
			this._superApply(arguments);
		},
		_destroy: function () {
			// remove elements that were added by this widget.
			this._form.remove();
			if (this._manualDialog) {
				this._manualDialog.remove();
			}
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
			selectedExtent: null,
			resizeWithWindow: true
		},
		_manualDialog: null,
		_drawButton: null,
		_manualButton: null,
		_clearButton: null,
		_map: null,
		_graphicsLayer: null,
		_setExtent: function (extent) {
			var $this = this, mapExtent, spsExtent;

			// Create the graphics layer if it does not already exist.
			if ($this._graphicsLayer) {
				$this._graphicsLayer.clear();
			} else {
				$this._graphicsLayer = new esri.layers.GraphicsLayer();
				$this._graphicsLayer.setRenderer(new esri.renderer.SimpleRenderer(new esri.symbol.SimpleLineSymbol()));
				$this._map.addLayer($this._graphicsLayer);
			}

			if (extent) {
				mapExtent = statePlaneSouthToWebMercator(extent);
				spsExtent = webMercatorToStatePlaneSouth(extent);

				$this._graphicsLayer.add(new esri.Graphic(mapExtent));
				$this.options.selectedExtent = spsExtent;
			} else {
				$this.options.selectedExtent = null;
			}

			$this._graphicsLayer.refresh();

			// Trigger event.
			$this._trigger("extentSelect", null, {
				mapExtent: mapExtent || null,
				spsExtent: spsExtent || null
			});

			return this;
		},
		// Use the _setOption method to respond to changes to options
		_setOption: function (key, value) {
			if (key === "selectedExtent") {
				this._setExtent(value);
			}

			this._superApply(arguments);
		},
		_isDrawing: false,
		_create: function () {
			/// <summary>Creates the envelopeSelector widget.</summary>
			var $this = this;



			require(["esri/toolbars/draw"], function () {
				$($this.element).arcGisMap({
					layers: $this.options.layers,
					resizeWithWindow: $this.options.resizeWithWindow,
					mapLoad: function (event, map) { // Although JSLint will complain, the "event" parameter is necessary for method signature.
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

						// If the selectedExtent option was specified in the constructor, ensure the box is added to the map.
						if ($this.options.selectedExtent) {
							$this._setExtent($this.options.selectedExtent);
						}

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
								$this._manualDialog = $("<div>").envelopeEntryDialog({
									selectedExtent: $this.options.selectedExtent,
									// Connect the dialog's extentSelect event.
									extentSelect: function (event, data) { // Although JSLint will complain, the "event" parameter is necessary for method signature.
										$this.option("selectedExtent", data.envelope);
									}
								});
							} else {
								$this._manualDialog.envelopeEntryDialog("option", "selectedExtent", $this.options.selectedExtent).envelopeEntryDialog("open");
							}
						});

						$this._clearButton = $("<button type='button'>Clear</button>").appendTo(buttonDiv).button({
							text: false,
							icons: {
								primary: "ui-icon-trash"
							}
						}).click(function () {
							$this._setExtent(null);
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