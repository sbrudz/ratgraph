//= require "_core"

ratgraph.choropleth = function (id, dimension, group, colorScale, geoJson) {
	var _id = id;
	var _chart = dc.leafletChoroplethChart(id);
	var _dimension = dimension;
	var _group = group;
	var _colorScale = colorScale;
	var _geoJson = geoJson;

	_chart._init = function() {

		var mapSize = ratgraph.calculateSvgSize(_id, margin, 1.2);

	    _chart.width(mapSize.width)
	        .height(mapSize.height)
	        .dimension(_dimension)
	        .group(_group)
			.center([40.739039, -73.920887])
			.zoom(11)
	        .colors(_colorScale)
			.colorDomain(function() {
				return [dc.utils.groupMin(this.group(), this.valueAccessor()),
				dc.utils.groupMax(this.group(), this.valueAccessor())];
			})
	        .colorAccessor(function (d) {
	            return d.value;
	        })
			.featureKeyAccessor(function(feature) {
				return feature.properties.ZIP;
			})
	        .geojson(_geoJson);

	    _chart.calculateColorDomain();

	    // Create a legend for the choropleth
	    // Thanks to http://eyeseast.github.io/visible-data/2013/08/27/responsive-legends-with-d3/
	    var legend = d3.select('#legend')
	        .append('ul')
	        .attr('class', 'list-inline');

	    var keys = legend.selectAll('li.key')
	        .data(_colorScale.range());

	    keys.enter().append('li')
	        .attr('class', 'key')
	        .style('border-left-color', String)
	        .text(function (d) {
	            var r = _colorScale.invertExtent(d);
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
