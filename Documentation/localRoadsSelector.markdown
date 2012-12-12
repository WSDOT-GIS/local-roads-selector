Local Roads Selector widget
===========================

This widget provides a map from which a user can select road segments.  A segment is defined by a main road and two intersecting roads.

## License ##
This code is licensed under [The MIT License].  See the `LICENSE` file for details.

## Acknowledgements ##
* [Proj4js]: This is used to perform client side map projections.

### Setup ###
The file [localRoadsSelector.html] demonstrates how to use this widget.

### Options ###

#### *reverseGeocodeHandlerUrl* ###
Since the [ArcGIS REST API] does not currently support reverse geocoding to an intersection, a special handler must be used that calls the [ArcGIS SOAP API](http://resources.arcgis.com/en/help/soap/10.1/)'s [reverse geocode](http://resources.arcgis.com/en/help/soap/10.1/#/ReverseGeocode/01vp000000n6000000/) endpoint and converts its results from XML to JSON.  The `ReverseGeocodeIntersection.ashx` handler provides this ability.
Defaults to `"/ReverseGeocodeIntersection.ashx"`.

#### *routeTaskUrl* ###
REST URL for a [network layer].
Defaults to `"http://tasks.arcgisonline.com/ArcGIS/rest/services/NetworkAnalysis/ESRI_Route_NA/NAServer/Route"`.

#### *resizeWithWindow* ###
Set to `true` to call the map's [resize] function when the browser window is resized.  Set to `false` otherwise.
Defaults to `true`.

### Events ###

#### *intersectionFound* event handler ###
You can specify a function that will be run each time an intersection is successfully located.
This function should have two parameters: `event` and `intersection`.

##### intersection #####
The `intersection` parameter is an [esri.Graphic] object with an [esri.geometry.Point] for its `geometry` property.

```javascript
$("#map").localRoadsSelector({
	intersectionFound: function (event, intersection) {
		console.log("Intersection found", intersection);
	}
});
```

#### *routeFound* event handler ###
You can specify a function that will be run each time a route is successfully located between two intersections.
This function should have two parameters: `event` and `route`.

##### route #####
The `route` parameter is an [esri.Graphic] object with an [esri.geometry.Polyline] for its `geometry` property.

```javascript
$("#map").localRoadsSelector({
	routeFound: function (event, route) {
		console.log("Route found", route);
	}
});
```

### Functions ###

#### addRoute ####
Adds a route graphic to the route layer utilizing the addRoutes function.
##### Parameters #####
* route ([esri.Graphic])
	A graphic representing a route.

##### Returns #####
[jQuery]

#### addRoutes ####
Adds an array of route graphics to the route graphics layer.
##### Parameters #####
* routes ([esri.Graphic]\[\]): An array of route graphics.

```javascript
var routes = [
    {
        "attributes": {
            "Name": "116th Ave SE & SE Petrovitsky Rd - 108th Ave SE & SE 176th St",
            "locationId": 1353099164768,
            "ogcSimpleGeometry": {
                "wkt": "MULTILINESTRING((1223201.051014798 774612.7067984978,1223186.9220523157 774612.1765571064,1220575.2740293862 774708.3255519208,1220563.1713036026 774708.585946937))",
                "srid": 2927
            }
        }
    }
];
$("#map").localRoadsSelector("addRoutes", routes);
```


##### Returns #####
[jQuery]
		
##### clearSegments #####
Deletes all graphics from the map.

##### Returns #####
[jQuery]

#### deleteLastSegment ####
Deletes the last route graphic that was added to the map.

##### Returns #####
[jQuery]

#### deleteRoutes ####
Deletes route graphics from the map.

##### Parameters #####
* routes ([esri.Graphic]\[\])

##### Returns #####
jQuery

#### deleteRoute ####
Deletes a route graphic from the map.

##### Parameters #####
* route ([esri.Graphic])
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
[esri.Graphic]\[\]

#### getSelectedRoutes ####
Returns all of the route graphics that have been selected.  A user selects route graphics from the map by clicking on them.

##### Returns #####
[esri.Graphic]\[\]

#### removeSelectedRoutes ####
Deletes all of the route graphics that have been selected.  A user selects route graphics from the map by clicking on them.

##### Returns #####
[jQuery]

[The MIT License]:http://opensource.org/licenses/MIT
[Proj4js]:https://github.com/bewest/proj4js
[localRoadsSelector.html]:../localRoadsSelector.html
[ArcGIS REST API]:http://resources.arcgis.com/en/help/rest/apiref/
[network layer]:http://resources.arcgis.com/en/help/rest/apiref/index.html?nalayer.html
[resize]:http://help.arcgis.com/en/webapi/javascript/arcgis/help/jsapi_start.htm#jsapi/map.htm#resize
[esri.Graphic]:http://help.arcgis.com/en/webapi/javascript/arcgis/help/jsapi_start.htm#jsapi/graphic.htm
[esri.geometry.Point]:http://help.arcgis.com/en/webapi/javascript/arcgis/help/jsapi_start.htm#jsapi/point.htm
[esri.geometry.Polyline]:http://help.arcgis.com/en/webapi/javascript/arcgis/help/jsapi_start.htm#jsapi/polyline.htm
[jQuery]:http://api.jquery.com/Types/#jQuery
