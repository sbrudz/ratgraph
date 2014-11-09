//= require "_core"

ratgraph.markerMap = function (id, dimension, group) {
	var _id = id;
	var _chart = dc.leafletMarkerChart(id);
	var _dimension = dimension;
	var _group = group;

	_chart._init = function() {

		var mapSize = ratgraph.calculateSvgSize(_id, margin, 1.2);

	    _chart.width(mapSize.width)
	        .height(mapSize.height)
	        .dimension(_dimension)
	        .group(_group)
			.center([40.7127, -74.0059])
			.zoom(7)
			// .locationAccessor()     // function (d) to access the property indicating the latlng (string or array); Default: keyAccessor
			// .marker()               // set function (d,map) to build the marker object. Default: standard Leaflet marker is built
			// .icon()                 // function (d,map) to build an icon object. Default: L.Icon.Default
			.popup(function (d, marker) {
        		return d.key + " : " + d.value;
      		})                // function (d,marker) to return the string or DOM content of a popup
			.cluster(true)          // set if markers should be clustered. Requires leaflet.markercluster.js; Default: false
			// .clusterObject({..})    // options for the markerCluster object
			.rebuildMarkers(false)  // set if all markers should be rebuild each time the map is redrawn. Degrades performance; Default: false
			.brushOn(true)          // if the map would select datapoints; Default: true
			.filterByArea(false)    // if the map should filter data based on the markers inside the zoomed in area instead of the user clicking on individual markers; Default: false
			;

	    return _chart;
	};

	return _chart._init();
};
