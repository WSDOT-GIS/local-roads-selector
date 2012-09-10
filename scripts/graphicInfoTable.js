/*global jQuery*/
/*jslint nomen: true, white: true */
(function ($) {
	"use strict";
	// All graphics will have the same attributes.

	$.widget("ui.graphicInfoList", {
		options: {
			initialGraphics: null,
			nameAttribute: "Name"
		},
		addGraphic: function (graphic) {
			/// <summary>Adds a graphic to the list</summary>
			/// <param name="graphic" type="esri.Graphic">A graphic.</param>
			/// <returns type="jQuery.ui.graphicInfoList" />
			var $this = this, list;
			list = this.element;
			$("<li>").text(graphic.attributes[$this.options.nameAttribute]).appendTo(list).data("graphic", graphic);

			return this;
		},
		removeGraphic: function (graphic) {
			/// <summary>Removes the list item from the list which has associated "graphic" data matching the "graphic" parameter.</summary>
			/// <param name="graphic" type="esri.Graphic">A graphic.</param>
			/// <returns type="jQuery.ui.graphicInfoList" />

			var list = this.element, listItems = $("li", list), i, l, listItem;

			for (i = 0, l = listItems.length; i < l; i += 1) {
				listItem = listItems[i];
				if ($(listItem).data("graphic") === graphic) {
					listItem.remove();
					break;
				}
			}

			return this;

		},
		_create: function () {
			var $this = this, i, l, graphic, graphics, list;

			list = $this.element;
			if (!/^[ol]l$/i.exec(list.localName)) {
				throw new Error("element must be li or ol");
			}

			graphics = $this.options.initialGraphics;

			for (i = 0, l = graphics.length; i < l; i += 1) {
				graphic = graphics[i];
				// Create a list item for the graphic and add to list.  Add the graphic as data of the list item.
				$this.addGraphic(graphic);
			}

			return this;
		},
		_destroy: function () {
			// Remove all list items from the list, returning it to its original state.  (This assumes that the list was empty before _create.)
			$("li", this.element).remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
} (jQuery));