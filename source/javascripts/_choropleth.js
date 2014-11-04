//= require "_core"

ratgraph.choropleth = function (id, dimension, group, colorScale, geoJson) {
	var _id = id;
	var _chart = dc.geoChoroplethChart(id);
	var _dimension = dimension;
	var _group = group;
	var _colorScale = colorScale;
	var _geoJson = geoJson;

	// Figure out scale and translate for geo projection
	// Thanks to http://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object
	// Create a unit projection.
	var _projection = d3.geo.albers()
	    .scale(1)
	    .translate([0, 0]);

	// Create a path generator.
	var _path = d3.geo.path()
	    .projection(_projection);

	_chart._init = function() {

		var mapSize = ratgraph.calculateSvgSize(_id, margin, 1.2);

	    // Compute the bounds of a feature of interest, then derive scale & translate.
	    var b = _path.bounds(_geoJson),
	        s = 0.95 / Math.max((b[1][0] - b[0][0]) / mapSize.width, (b[1][1] - b[0][1]) / mapSize.height),
	        t = [(mapSize.width - s * (b[1][0] + b[0][0])) / 2, (mapSize.height - s * (b[1][1] + b[0][1])) / 2];

	    // Update the projection to use computed scale & translate.
	    _projection
	        .scale(s)
	        .translate(t);

	    _chart.width(mapSize.width)
	        .height(mapSize.height)
	        .dimension(_dimension)
	        .group(_group, "Rat Sightings by Zip Code")
	        .colors(_colorScale)
	        .colorAccessor(function (d) {
	            return d.value;
	        })
	        .colorCalculator(function (d) {
	            return d ? _chart.colors()(d) : 'lightgray';
	        })
	        .overlayGeoJson(_geoJson.features, "zip_code", function (d) {
	            return d.properties.ZIP;
	        })
	        .projection(_projection);

	    _chart.calculateColorDomain();

	    // Create a legend for the choropleth
	    // Thanks to http://eyeseast.github.io/visible-data/2013/08/27/responsive-legends-with-d3/
	    var legend = d3.select('#legend')
	        .append('ul')
	        .attr('class', 'list-inline');

	    var keys = legend.selectAll('li.key')
	        .data(colorScale.range());

	    keys.enter().append('li')
	        .attr('class', 'key')
	        .style('border-left-color', String)
	        .text(function (d) {
	            var r = colorScale.invertExtent(d);
	            return formatCount(r[0]);
	        });

	    _chart.renderlet(function (chart) {
	        d3.select('#legend').selectAll('li.key')
	            .data(_chart.colors().range())
	            .text(function (d) {
	                var r = _chart.colors().invertExtent(d);
	                return formatCount(r[0]);
	            });

	    });

	    return _chart;
	};

	return _chart._init();
};
