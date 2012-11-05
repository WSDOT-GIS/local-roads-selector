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
					type: "number",
					name: name || idSuffix,
					required: true,
					placeholder: placeholder || label,
					id: id
				}).appendTo(div);
			}

			$this._form = $("<form>").attr({
				action: "#",
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
			// TODO perform projection if necessary.

			return output;
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