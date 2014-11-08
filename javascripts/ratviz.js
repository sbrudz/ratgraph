/**
	Core namespace
**/

var ratgraph = {
	margins: {
	    top: 10,
	    left: 10,
	    bottom: 10,
	    right: 10
	}
};

ratgraph.calculateSvgSize = function(id, margin, heightRatio) {
    var width = parseInt(d3.select(id).style('width')),
        height = width * heightRatio;
    width = Math.max(100, width - margin.left - margin.right);
    height = Math.max(150, height - margin.top - margin.bottom);
    return {
        height: height,
        width: width
    };
}
;

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

ratgraph.histogram = function (id, dimension, group) {
	var _id = id;
	var _chart = dc.barChart(id);
	var _dimension = dimension;
	var _group = group;

    var _shortMonthTickFormat = d3.time.format.multi([
        ["%b", function (d) {
            return d.getMonth();
        }],
        ["%Y", function () {
            return true;
        }]
    ]);

	_chart._init = function() {

	    var timeScale = d3.time.scale()
	        .domain([_dimension.bottom(1)[0].created_date, _dimension.top(1)[0].created_date])
	        .nice(d3.time.month);

	    _chart.margins({
	            top: 10,
	            right: 10,
	            bottom: 20,
	            left: 40
	        })
	        .dimension(_dimension)
	        .group(_group)
	        .x(timeScale)
	        .round(d3.time.month.round)
	        .xUnits(d3.time.months)
	        .elasticY(true)
	        .yAxisLabel('# Complaints')
	        .renderHorizontalGridLines(true);

	    _chart.xAxis().tickFormat(_shortMonthTickFormat);

	    d3.select(window).on('resize', _chart.resize);

		return _chart;
	};

	_chart._calculateSize = function () {
	    var histSize = calculateSvgSize(_id, margin, 0.33);
	    _chart.height(histSize.height).width(histSize.width);
	    _chart.xAxis().ticks(Math.max(histSize.width / 50, 2));
	    _chart.yAxis().ticks(Math.max(histSize.height / 50, 2));
		return _chart;		
	};

	_chart.resize = function() {
		_chart._calculateSize();
		_chart.render();
	    return _chart;
	};

	return _chart._init()._calculateSize();
};

ratgraph.bubble = function (id, dimension, group, demographics) {
	var _id = id;
	var _chart = dc.bubbleChart(id);
	var _dimension = dimension;
	var _group = group;

	var _formatIncomeAxis = d3.format("$s");
	var _incomeFormat = d3.format("$.3s");
	var _formatCount = d3.format(",.0f");

	_chart._init = function(demographics) {

	    var peopleExtent = d3.extent(demographics, function (d) {
		    	return d.people_per_acre;
		    });
		var peopleScale = d3.scale.linear().domain([peopleExtent[0],peopleExtent[1]]);

	    var incomeExtent = d3.extent(demographics, function (d) {
		    	return d.median_income;
		    });
		var incomeScale = d3.scale.linear().domain([incomeExtent[0],incomeExtent[1]]);

	    _chart
	    	.dimension(_dimension)
	    	.group(_group)
	        .data(function (group) {
	        	var topToUse = d3.select("#topSelect").node().value;
	        	if (topToUse === "all")
	        		return group.all();
	        	else
		            return group.top(topToUse);
	        })
	    	.margins({top: 10, right: 10, bottom: 30, left: 50})
	        .radiusValueAccessor(function (d) {
	            return d.value.count;
	        })
	        .elasticRadius(false)
	        .keyAccessor(function (d) {
	            return d.value.people_per_acre;
	        })
	        .valueAccessor(function (d) {
	            return d.value.median_income;
	        })
	        .colors(colorScale)
	        .colorAccessor(function (d) {
	            return d.value.count;
	        })
	        .x(peopleScale)
	        .elasticX(true)
	        .y(incomeScale)
	        .elasticY(true)
	        .maxBubbleRelativeSize(0.05)
	        .yAxisPadding('10%')
	        .xAxisPadding('10%')
	        .renderHorizontalGridLines(true)
	        .renderVerticalGridLines(true)
	        .xAxisLabel('Population Density (people per acre)')
	        .yAxisLabel('Median Household Income')
	        .label(function (p) {
	            return p.key;
	        })
	        .renderTitle(true)
	        .title(function (p) {
	            return ["Zip Code:" + p.value.zip_name,
	            	   "# Complaints: " + _formatCount(p.value.count),
	                   "Pop. Density: " + _formatCount(p.value.people_per_acre) + " people per acre",
	                   "Median Income: " + _incomeFormat(p.value.median_income)]
	                   .join("\n");
	        })
	        .r(d3.scale.linear().domain([0, 2000]))
	        .yAxis().tickFormat(function (v) {
	            return _formatIncomeAxis(v);
	        });

		var changeTopZipCodeSelection = function () {
			_chart.redraw();
		};
	    d3.select("#topSelect").on("change", changeTopZipCodeSelection);

	    d3.select(window).on('resize', _chart.resize);

		return _chart;
	};

	_chart._calculateSize = function () {
	    var svgSize = calculateSvgSize(_id, margin, 0.33);
	    _chart.height(svgSize.height).width(svgSize.width);
	    _chart.xAxis().ticks(Math.max(svgSize.width / 50, 2));
	    _chart.yAxis().ticks(Math.max(svgSize.height / 50, 2));
		return _chart;
	};

	_chart.resize = function() {
		_chart._calculateSize();
		_chart.render();
	    return _chart;
	};

	return _chart._init(demographics);
};




"use strict";

var spinner = new Spinner().spin(document.body);

var margin = {
    top: 10,
    left: 10,
    bottom: 10,
    right: 10
};

function calculateSvgSize(id, margin, heightRatio) {
    var width = parseInt(d3.select(id).style('width')),
        height = width * heightRatio;
    width = Math.max(100, width - margin.left - margin.right);
    height = Math.max(150, height - margin.top - margin.bottom);
    return {
        height: height,
        width: width
    };
}

var parseDate = d3.time.format("%m/%d/%Y %I:%M:%S %p").parse;
var formatDate = d3.time.format("%m/%y");
var formatCount = d3.format(",.0f");
var formatCountAxis = d3.format("s");

// Thanks to http://colorbrewer2.org/
var colorScale = d3.scale.quantize().range(['rgb(255,255,204)','rgb(194,230,153)','rgb(120,198,121)','rgb(49,163,84)','rgb(0,104,55)']);

var histogram = null, choropleth = null, bubble = null;
var boroughRow = dc.rowChart("#boroughRow");
var typeRow = dc.rowChart("#typeRow");
var topZipCodes = dc.rowChart("#topZipCodes");

function complaintsParser(d) {
	return {
		created_date: new Date(+d["Created Date"]),
		zip_code: d["Incident Zip"],
		borough: d["Borough"],
		type: d["Descriptor"]
	};
}

function demographicsParser(d) {
	return {
		zip_code: d.zip_code,
		people_per_acre: +d.people_per_acre,
		median_income: +d.median_income,
		land_area_acres: +d.land_area_acres,
		name: d.name
	};
}

queue()
    .defer(d3.csv, "data/nyc_rodent_complaints_cleaned.csv", complaintsParser)
    .defer(d3.json, "data/nyc-zip-code.json")
    .defer(d3.csv, "data/nyc_zip_demographics.csv", demographicsParser)
    .await(ready);

function ready(error, rawData, nycZipJson, nycZipDemographics) {

    if (error) {
        console.warn(error);
    }

    var data = crossfilter(rawData),
    	all = data.groupAll();

    var zipCodes = data.dimension(function (d) {
        return d.zip_code;
    });

    var zipCodeCounts = zipCodes.group();

    var topZipCodesDim = data.dimension(function (d) {
    	return d.zip_code;
    });

    var topZipCodeCounts = topZipCodesDim.group();

    var demographicBubblesDim = data.dimension(function (d) {
    	return d.zip_code;
    });

    // Create a map so we can quickly loop up demographic info by zip code
    var zipDemoIndex = {};
    nycZipDemographics.forEach(function (d) {
    	zipDemoIndex[d.zip_code] = d;
    });

    var demographicBubbleCount = demographicBubblesDim.group().reduce(
        function (p, v) {
            if (zipDemoIndex[v.zip_code]) {
                p.count++;
            }
            if (!p.hasOwnProperty("zip_name") && zipDemoIndex[v.zip_code]) {
                p.zip_name = zipDemoIndex[v.zip_code].name
                p.people_per_acre = zipDemoIndex[v.zip_code].people_per_acre;
                p.median_income = zipDemoIndex[v.zip_code].median_income;
            }
            return p;
        }, 
        function (p, v) {
            if (zipDemoIndex[v.zip_code]) {
                p.count--;
            }
            return p;
        }, 
        function () {
            return {count: 0};
        }).order(function (p) {
            return p.count;
        });

    var time = data.dimension(function (d) {
        return d.created_date;
    });
    var timeCounts = time.group(function (d) {
        return d3.time.month(d);
    }).reduceCount();

    var borough = data.dimension(function (d) {
        return d.borough;
    });
    var boroughCounts = borough.group().reduceCount();

    var type = data.dimension(function (d) {
        return d.type;
    });
    var typeCounts = type.group().reduceCount();

    choropleth = ratgraph.choropleth("#choropleth", zipCodes, zipCodeCounts, colorScale, nycZipJson);

    choropleth.title(function (d) {
        var name = zipDemoIndex[d.key] ? zipDemoIndex[d.key].name : d.key;
        return "Zip Code: " + name + "\n# Complaints: " + formatCount(d.value);
    });

    histogram = ratgraph.histogram("#histogram", time, timeCounts);

    bubble = ratgraph.bubble("#demographicBubble", demographicBubblesDim, demographicBubbleCount, nycZipDemographics);

    boroughRow.dimension(borough)
        .group(boroughCounts)
        .colors(function() {
        	return "rgb(107, 174, 214)";
        })
        .title(function (d) {
            return "# Complaints: " + formatCount(d.value);
        })
        .elasticX(true)
        .ordering(function (d) {
            return -d.value;
        });

    boroughRow.xAxis().ticks(5).tickFormat(function(v) {
    	return formatCountAxis(v);
    });
    boroughRow.margins().right = 5;
    boroughRow.margins().left = 5;

    typeRow.dimension(type)
        .group(typeCounts)
        .colors(function() {
        	return "rgb(107, 174, 214)";
        })
        .elasticX(true)
        .title(function (d) {
            return "# Complaints: " + formatCount(d.value);
        })
        .ordering(function (d) {
            return -d.value;
        });

    typeRow.xAxis().ticks(5).tickFormat(function(v) {
    	return formatCountAxis(v);
    });
    typeRow.margins().right = 5;
    typeRow.margins().left = 5;

    topZipCodes.dimension(topZipCodesDim)
        .group(topZipCodeCounts)
        .colors(colorScale)
        .colorAccessor(function (d) {
            return d.value;
        })
        .data(function (group) {
            return group.top(5);
        })
        .label(function(d) { 
        	return zipDemoIndex[d.key] ? zipDemoIndex[d.key].name : d.key;
        })
        .title(function (d) {
            return "# Complaints: " + formatCount(d.value);
        })
        .elasticX(true)
        .ordering(function (d) {
            return -d.value;
        });

    topZipCodes.xAxis().ticks(5).tickFormat(function(v) {
    	return formatCountAxis(v);
    });
    topZipCodes.margins().right = 5;
    topZipCodes.margins().left = 5;

    var updateChloroplethScale = function (chart, filter) {
        var domain = [d3.min(choropleth.group().all(), choropleth.colorAccessor()),
            d3.max(choropleth.group().all(), choropleth.colorAccessor())];
        choropleth.colorDomain(domain);
    };

    boroughRow.on('filtered', updateChloroplethScale);
    typeRow.on('filtered', updateChloroplethScale);
    histogram.on('filtered', updateChloroplethScale);

    resize();

    spinner.stop();
    d3.select('#graph').style('visibility', 'visible');
}

function resize() {

    var boroughSize = calculateSvgSize('#boroughRow', margin, 1);
    boroughRow.height(boroughSize.height).width(boroughSize.width);
    boroughRow.xAxis().ticks(Math.max(boroughSize.width / 50, 2));

    var typeSize = calculateSvgSize('#typeRow', margin, 1);
    typeRow.height(typeSize.height).width(typeSize.width);
    typeRow.xAxis().ticks(Math.max(typeSize.width / 50, 2));

    var topZipCodesSize = calculateSvgSize('#topZipCodes', margin, 1);
    topZipCodes.height(topZipCodesSize.height).width(topZipCodesSize.width);
    topZipCodes.xAxis().ticks(Math.max(topZipCodesSize.width / 50, 2));

    dc.renderAll();
}

d3.select(window).on('resize', resize);
