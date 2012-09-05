Local Roads Selector widget
===========================

This widget provides a map from which a user can select road segments.  A segment is defined by a main road and two intersecting roads.

## License ##
This code is licensed under [The MIT License](http://opensource.org/licenses/MIT).  See the `LICENSE` file for details.

## Setup ##
1. Place the following into your page's `<head>`
```html
<link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.23/themes/base/jquery-ui.css" />
```

2. Place the following script references into your page.
```html
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.0/jquery.min.js"></script>
<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.23/jquery-ui.min.js"></script>
<script type="text/javascript" src="//serverapi.arcgisonline.com/jsapi/arcgis/?v=3.1compact"></script>
<script src="../Scripts/arcGisMap.js"></script>
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
				geometryServiceUrl: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer",
				layers: [
					{
						url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/",
						type: "esri.layers.ArcGISTiledMapServiceLayer"
					}
				],
				intersectionFound: function (event, intersection) {
					//console.log(intersection.geometry, new ogc.SimpleGeometry(intersection.geometry).toEsriGeometry());
				},
				routeFound: function (event, route) {
					//console.log(route.geometry, new ogc.SimpleGeometry(route.geometry).toEsriGeometry());
				},
				resizeWithWindow: false
			});
		});
} (jQuery));
```

## *localRoadsSelector* parameters ##

### *reverseGeocodeHandlerUrl* ###
Since the [ArcGIS REST API](http://resources.arcgis.com/en/help/rest/apiref/) does not currently support reverse geocoding to an intersection, a special handler must be used that calls the [ArcGIS SOAP API](http://resources.arcgis.com/en/help/soap/10.1/)'s [reverse geocode](http://resources.arcgis.com/en/help/soap/10.1/#/ReverseGeocode/01vp000000n6000000/) endpoint and converts its results from XML to JSON.  The `ReverseGeocodeIntersection.ashx` handler provides this ability.

### *routeTaskUrl* ###
REST URL for a [network layer](http://resources.arcgis.com/en/help/rest/apiref/index.html?nalayer.html).

### *geometryServiceUrl* ###
REST URL for a [geoemtry service](http://resources.arcgis.com/en/help/rest/apiref/index.html?geometryserver.html).

### *resizeWithWindow* ###
Set to `true` to call the map's [resize](http://help.arcgis.com/en/webapi/javascript/arcgis/help/jsapi_start.htm#jsapi/map.htm#resize) function when the browser window is resized.  Set to `false` otherwise.

### *intersectionFound* event handler ###
You can specify a function that will be run each time an intersection is successfully located.

### *routeFound* event handler ###
You can specify a function that will be run each time a route is successfully located between two intersections.