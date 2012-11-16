﻿Envelope Selector
=================

A widget that allows a user to select an extent on a map.

## License ##
This code is licensed under [The MIT License](http://opensource.org/licenses/MIT).  See the `LICENSE` file for details.

## Acknowledgements ##
* [Proj4js](https://github.com/bewest/proj4js): This is used to perform client side map projections.

## Setup ##
See `envelopeSelector.html`.

## Options ##

### layers ###
Specifies which layers will be in the map.  This option can only be set when creating the widget.  If this option is omitted a default layer will be used. (This is the same layer that is shown in the example below.)

#### Example: Specifiying a layer. ####
```javascript
$("#map").envelopeSelector({
	layers: [
					{
						url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/",
						type: "esri.layers.ArcGISTiledMapServiceLayer"
					}
			]
});
```

### selectedExtent ###
Gets or sets the extent that is selected in the map.

#### Example: Specify an extent upon creation ####
```javascript
$("#map").envelopeSelector({
	selectedExtent: { "xmin": 1001497, "ymin": 560300, "xmax": 1401238, "ymax": 872293, "spatialReference": { "wkid": 2927} }
});
```

#### Example: Change the extent. ####
```javascript
$("#map").envelopeSelector("option", {
	selectedExtent: { "xmin": 1001497, "ymin": 560300, "xmax": 1401238, "ymax": 872293, "spatialReference": { "wkid": 2927} }
});
```

#### Example: Get the currently selected extent. ####
```javascript
var extent = $("#map").envelopeSelector("option", "selectedExtent");
```

## Events ##

### `extentSelect` ###
This event is triggered when the `selectedExtent` option is changed either by the user through the UI or through the `option` function.
The data object returned from this event has two parameters: `mapExtent` and `spsExtent`.  Each of these is an [esri.geometry.Extent] object representing the selected extent in a different coordinate system.
The spatial reference of `mapExtent` is [Web Mercator Auxiliary Sphere (EPSG:3857)]* and `spsExtent` is [Washington State Plane South (EPSG:2927)]
```javascript
$("#map").envelopeSelector({
	extentSelect: function(event, data) {
		
	}
});
```

* The spatial reference of `mapExtent` is actually the same as whatever the map is using.  This is normally [Web Mercator Auxiliary Sphere (EPSG:3857)], but it is possible to set it to a different one.

[esri.geometry.Extent]:(http://help.arcgis.com/en/webapi/javascript/arcgis/help/jsapi_start.htm#jsapi/extent.htm)
[Washington State Plane South (EPSG:2927)]:(http://spatialreference.org/ref/epsg/2927/)
[Web Mercator Auxiliary Sphere (EPSG:3857)]:(http://spatialreference.org/ref/sr-org/7483/)