//= require "_core"

ratgraph.markerMap = function (id, dimension, group) {
	var _id = id;
	var _chart = dc.leafletMarkerChart(id);
	var _dimension = dimension;
	var _group = group;

	_chart._init = function() {

		var mapSize = ratgraph.calculateSvgSize(_id, margin, 1.2);

	    _chart.width(500)
	        .height(500)
	        .dimension(_dimension)
	        .group(_group)
			.center([40.7127, -74.0059])
			.zoom(7)
			.cluster(true)          // set if markers should be clustered. Requires leaflet.markercluster.js; Default: false
			;

	    return _chart;
	};

	return _chart._init();
};
