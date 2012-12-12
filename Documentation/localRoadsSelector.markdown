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

#### Example ####
```javascript
var routes = $("#map").localRoadsSelector("getGroupedRoutes");
if (routes !== null) {
	console.log(routes);
} else {
	console.log("No routes have been defined.");
}
```

##### Sample return value #####
```javascript
{
    "1355338732142": [
        {
            "geometry": {
                "type": "polyline",
                "paths": [
                    [
                        [
                            1186799.057732169,
                            835314.3140107573
                        ],
                        [
                            1186805.6363076824,
                            835301.445778887
                        ],
                        [
                            1187346.337050181,
                            835631.8497222965
                        ],
                        [
                            1187368.3051571588,
                            835644.9991786013
                        ]
                    ]
                ],
                "_path": 0,
                "spatialReference": {
                    "wkid": 2927
                }
            },
            "symbol": null,
            "attributes": {
                "Name": "Pike St from 2nd Ave to 4th Ave",
                "locationId": 1355338732142,
                "ogcSimpleGeometry": {
                    "wkt": "MULTILINESTRING((1186799.057732169 835314.3140107573,1186805.6363076824 835301.445778887,1187346.337050181 835631.8497222965,1187368.3051571588 835644.9991786013))",
                    "srid": 2927
                }
            },
            "infoTemplate": null
        }
    ],
    "1355338751481": [
        {
            "geometry": {
                "type": "polyline",
                "paths": [
                    [
                        [
                            1187574.750603493,
                            835272.7489221067
                        ],
                        [
                            1187586.7677611143,
                            835254.0551580809
                        ],
                        [
                            1187099.29867384,
                            834984.4369215
                        ],
                        [
                            1187023.2088859722,
                            834941.791802024
                        ]
                    ]
                ],
                "_path": 0,
                "spatialReference": {
                    "wkid": 2927
                }
            },
            "symbol": null,
            "attributes": {
                "Name": "Union St from 4th Ave to 2nd Ave",
                "locationId": 1355338751481,
                "ogcSimpleGeometry": {
                    "wkt": "MULTILINESTRING((1187574.750603493 835272.7489221067,1187586.7677611143 835254.0551580809,1187099.29867384 834984.4369215,1187023.2088859722 834941.791802024))",
                    "srid": 2927
                }
            },
            "infoTemplate": null
        },
        {
            "geometry": {
                "type": "polyline",
                "paths": [
                    [
                        [
                            1187023.2088859722,
                            834941.791802024
                        ],
                        [
                            1187011.7875686444,
                            834935.3905150539
                        ],
                        [
                            1187232.9148405285,
                            834576.2868285552
                        ],
                        [
                            1187232.9148456738,
                            834576.2870494352
                        ],
                        [
                            1187234.8844639515,
                            834572.8426131252
                        ]
                    ]
                ],
                "_path": 0,
                "spatialReference": {
                    "wkid": 2927
                }
            },
            "symbol": null,
            "attributes": {
                "Name": "2nd Ave from Union St to University St",
                "locationId": 1355338751481,
                "ogcSimpleGeometry": {
                    "wkt": "MULTILINESTRING((1187023.2088859722 834941.791802024,1187011.7875686444 834935.3905150539,1187232.9148405285 834576.2868285552,1187232.9148456738 834576.2870494352,1187234.8844639515 834572.8426131252))",
                    "srid": 2927
                }
            },
            "infoTemplate": null
        }
    ]
}
```

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
