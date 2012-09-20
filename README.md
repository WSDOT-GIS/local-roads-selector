﻿Local Roads Selector widget
===========================

This widget provides a map from which a user can select road segments.  A segment is defined by a main road and two intersecting roads.

## License ##
This code is licensed under [The MIT License](http://opensource.org/licenses/MIT).  See the `LICENSE` file for details.

## Acknowledgements ##
* [Proj4js](https://github.com/bewest/proj4js): This is used to perform client side map projections.

## Setup ##
1. Place the following into your page's `<head>`
```html
<link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.23/themes/base/jquery-ui.css" />
```

2. Place the following script references into your page.
```html
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.0/jquery.min.js"></script>
<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.23/jquery-ui.min.js"></script>
<script>
	// Setup custom dojo package paths.
	var dojoConfig = {
		packages: [
			{
				"name": "ogc",
				"location": location.pathname.replace(/\/[^/]+$/, "") + "/scripts/ogc"
			}
		]
	};
</script>
<script type="text/javascript" src="//serverapi.arcgisonline.com/jsapi/arcgis/?v=3.1compact"></script>
<script src="../Scripts/arcGisMap.js"></script>
<script src="scripts/proj4js/proj4js-compressed.js" type="text/javascript"></script>
<script src="scripts/proj4js/defs/EPSG2927.js" type="text/javascript"></script>
<script src="scripts/proj4js/defs/EPSG3857.js" type="text/javascript"></script>
<script src="scripts/clientProjection.js" type="text/javascript"></script>
<script src="../Scripts/localRoadsSelector.js"></script>
```

3. Add the following JavaScript to your page after the script references.
```javascript
(function ($) {
		"use strict";
		$().ready(function () {
			$("#map").localRoadsSelector({
				reverseGeocodeHandlerUrl: "../ReverseGeocodeIntersection.ashx",
				routeTaskUrl: "http://tasks.arcgisonline.com/ArcGIS/rest/services/NetworkAnalysis/ESRI_Route_NA/NAServer/Route",
				layers: [
					{
						url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/",
						type: "esri.layers.ArcGISTiledMapServiceLayer"
					}
				],
				intersectionFound: function(intersection) {
					//console.log(intersection.geometry, new ogc.SimpleGeometry(intersection.geometry).toEsriGeometry());
				},
				routeFound: function(route) {
					//console.log(route.geometry, new ogc.SimpleGeometry(route.geometry).toEsriGeometry());
				},
				resizeWithWindow: false
			});
		});
} (jQuery));
```

## *localRoadsSelector* widget ##
### Options ###

#### *reverseGeocodeHandlerUrl* ###
Since the [ArcGIS REST API](http://resources.arcgis.com/en/help/rest/apiref/) does not currently support reverse geocoding to an intersection, a special handler must be used that calls the [ArcGIS SOAP API](http://resources.arcgis.com/en/help/soap/10.1/)'s [reverse geocode](http://resources.arcgis.com/en/help/soap/10.1/#/ReverseGeocode/01vp000000n6000000/) endpoint and converts its results from XML to JSON.  The `ReverseGeocodeIntersection.ashx` handler provides this ability.

#### *routeTaskUrl* ###
REST URL for a [network layer](http://resources.arcgis.com/en/help/rest/apiref/index.html?nalayer.html).

#### *resizeWithWindow* ###
Set to `true` to call the map's [resize](http://help.arcgis.com/en/webapi/javascript/arcgis/help/jsapi_start.htm#jsapi/map.htm#resize) function when the browser window is resized.  Set to `false` otherwise.

### Events ###

#### *intersectionFound* event handler ###
You can specify a function that will be run each time an intersection is successfully located.

#### *routeFound* event handler ###
You can specify a function that will be run each time a route is successfully located between two intersections.

### Functions ###

#### addRoute ####
Adds a route graphic to the route layer utilizing the addRoutes function.
##### Parameters #####
* route ([esri.Graphic](http://help.arcgis.com/en/webapi/javascript/arcgis/help/jsapi_start.htm#jsapi/graphic.htm))
	A graphic representing a route.

##### Returns #####
[jQuery](http://api.jquery.com/Types/#jQuery)

#### addRoutes ####
Adds an array of route graphics to the route graphics layer.
##### Parameters #####
* routes (esri.Graphic[]): An array of route graphics.

##### Returns #####
jQuery
		
##### clearSegments #####
Deletes all graphics from the map.

##### Returns #####
jQuery

#### deleteLastSegment ####
Deletes the last route graphic that was added to the map.

##### Returns #####
jQuery

#### deleteRoutes ####
Deletes route graphics from the map.

##### Parameters #####
* routes (esri.Graphic[])

##### Returns #####
jQuery

#### deleteRoute ####
Deletes a route graphic from the map.

##### Parameters #####
* route (esri.Graphic)
	A route graphic.

##### Returns #####
jQuery

#### getGroupedRoutes ####
Gets the route graphics from the map and groups them by their locationId attribute.  Each unique locationId will have corresponding property in the output object.

##### Returns #####
Object

#### getRoutes ####
Create projected copies of route polyline graphics and return them in an array

##### Returns #####
esri.Graphic[]

#### getSelectedRoutes ####
Deletes all of the route graphics that have been selected.  A user selects route graphics from the map by clicking on them.

##### Returns #####
esri.Graphic[]

#### removeSelectedRoutes ####
Removes from the map all routes that are currently selected.

##### Returns #####
jQuery