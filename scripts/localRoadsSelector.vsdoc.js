// This file only provides documentation to Visual Studio and should not be referenced by an application.

jQuery.ui.localRoadsSelector = function (options) {
	/// <summary>A jQuery widget that allows a user to select local road segments by clicking on intersections.</summary>
	/// <param name="options" type="object">
	/// <para>Options</para>
	/// <para>reverseGeocodeHandlerUrl:	The path to the ReverseGeocodeIntersection.ashx file.</para>
	/// <para>routeTaskUrl:	The URL of the ArcGIS Server route service that will be used to find a line segment between intersections.</para>
	/// <para>layers:	Defines the layer(s) that will appear in the map.</para>
	/// <para>resizeWithWindow: Set to true if the map should resize when the window resizes.  Set to false otherwise.</para>
	/// </param>
};

jQuery.ui.localRoadsSelector.prototype = {
	addRoute: function (route) {
		/// <summary>Adds a route graphic to the route layer utilizing the addRoutes function.</summary>
		/// <param name="route" type="esri.Graphic">A graphic representing a route.</param>
		/// <returns type="jQuery" />
	},
	addRoutes: function (routes) {
		/// <summary>Adds an array of route graphics to the route graphics layer.</summary>
		/// <param name="routes" type="esri.Graphic[]">An array of route graphics.</param>
		/// <returns type="jQuery" />
	},
	clearSegments: function () {
		/// <summary>Deletes all graphics from the map.</summary>
		/// <returns type="jQuery" />
	},
	deleteLastSegment: function () {
		/// <summary>Deletes the last route graphic that was added to the map.</summary>
		/// <returns type="jQuery" />
	},
	deleteRoutes: function (routes) {
		/// <summary>Deletes route graphics from the map.</summary>
		/// <param name="routes" type="esri.Graphic[]">An array of route graphics.</param>
		/// <returns type="jQuery" />
	},
	deleteRoute: function (route) {
		/// <summary>Deletes a route graphic from the map.</summary>
		/// <param name="route" type="esri.Graphic">A route graphic.</param>
		/// <returns type="jQuery" />
	},
	getGroupedRoutes: function () {
		/// <summary>Gets the route graphics from the map and groups them by their locationId attribute.  Each unique locationId will have corresponding property in the output object.</summary>
		/// <returns type="Object" />
	},
	getRoutes: function () {
		/// <summary>Create projected copies of route polyline graphics and return them in an array</summary>
		/// <returns type="esri.Graphic[]" />
	},
	getSelectedRoutes: function () {
		/// <summary>Deletes all of the route graphics that have been selected.  Route graphics can be selected by clicking on them.</summary>
		/// <returns type="esri.Graphic[]" />
	},
	removeSelectedRoutes: function () {
		/// <summary>Removes from the map all routes that are currently selected.</summary>
		/// <returns type="jQuery" />
	}
}