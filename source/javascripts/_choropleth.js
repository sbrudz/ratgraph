//= require "_core"

ratgraph.choropleth = function (id, dimension, group, colorScale, geoJson) {
	var _id = id;
	var _chart = dc.leafletChoroplethChart(id);
	var _dimension = dimension;
	var _group = group;
	var _colorScale = colorScale;
	var _geoJson = geoJson;

	_chart._init = function() {

		var southWest = L.latLng(40.4856, -74.27238),
		    northEast = L.latLng(40.92026, -73.69011),
		    bounds = L.latLngBounds(southWest, northEast);

	    _chart
	        .dimension(_dimension)
	        .group(_group)
	        .mapOptions({
	        	maxBounds: bounds
	        })
	        .tiles(function (map) {
	        	var Stamen_TonerLite = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
					attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
					subdomains: 'abcd',
					minZoom: 10,
					maxZoom: 20
				});
				Stamen_TonerLite.addTo(map);
	        })
			.center([40.74023, -73.96202])
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
			.featureOptions({
		        'fillColor': 'lightgray',
		        'color': 'rgb(0,104,55)',
		        'opacity': 0.8,
		        'fillOpacity': 0.6,
		        'weight': 1
    		})
    		.featureStyle(function (feature) {
		        var options = _chart.featureOptions();
		        if (options instanceof Function) {
		            options = options(feature);
		        }
		        options = JSON.parse(JSON.stringify(options));
		        var v = _chart.dataMap()[_chart.featureKeyAccessor()(feature)];
		        if (v && v.d) {
		        	if (v.d.value > 0) {
			            options.fillColor = _chart.getColor(v.d, v.i);
			        }
		            if (_chart.filters().indexOf(v.d.key) !== -1) {
		            	options.color = 'steelblue';
		            	options.weight = 4;
		            }
		        }
		        else {
		        	options.fill = false;
		        	options.stroke = false;
		        }
		        return options;
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
	        .style('border-top-color', String)
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

	    d3.select(window).on('resize.map', _chart.resize);

	    return _chart;
	};

	_chart._calculateSize = function () {
		var chartDiv = d3.select(_id);

		var viewportWidth = document.documentElement.clientWidth;
		var viewportHeight = document.documentElement.clientHeight;
		var mapAspectRatio;
		if (viewportWidth <= 800) {
			mapAspectRatio = 1;
		}
		else {
			mapAspectRatio = (viewportHeight-60) / (viewportWidth / 2);
		}

		var width = parseInt(chartDiv.style('width'));
		var height = width * mapAspectRatio;

	    _chart.height(height).width(width);

	    // leaflet needs a container with an explicit height
		chartDiv.style('height',height+'px');

		return _chart;
	};

	_chart.resize = function() {
		_chart._calculateSize();
		_chart.render();
	    return _chart;
	};


	return _chart._init()._calculateSize();
};
