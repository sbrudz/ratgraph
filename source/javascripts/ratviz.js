"use strict";

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

var mapSize = calculateSvgSize('#choropleth', margin, 1.2);
var histSize = calculateSvgSize('#histogram', margin, 0.33);
var boroughSize = calculateSvgSize('#boroughRow', margin, 1);
var typeSize = calculateSvgSize('#typeRow', margin, 1);
var topZipCodesSize = calculateSvgSize('#topZipCodes', margin, 1);
var demographicBubbleSize = calculateSvgSize('#demographicBubble', margin, 1.2);

var parseDate = d3.time.format("%m/%d/%Y %I:%M:%S %p").parse;
var formatDate = d3.time.format("%m/%y");
var formatCount = d3.format(",.0f");


// Thanks to http://colorbrewer2.org/
var colorScale = d3.scale.quantize().range(['rgb(255,255,229)', 'rgb(247,252,185)', 'rgb(217,240,163)', 'rgb(173,221,142)', 'rgb(120,198,121)', 'rgb(65,171,93)', 'rgb(35,132,67)', 'rgb(0,104,55)', 'rgb(0,69,41)']);

// Figure out scale and translate for geo projection
// Thanks to http://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object
// Create a unit projection.
var projection = d3.geo.albers()
    .scale(1)
    .translate([0, 0]);

// Create a path generator.
var path = d3.geo.path()
    .projection(projection);

var choropleth = dc.geoChoroplethChart("#choropleth");
var histogram = dc.barChart("#histogram");
var boroughRow = dc.rowChart("#boroughRow");
var typeRow = dc.rowChart("#typeRow");
var topZipCodes = dc.rowChart("#topZipCodes");
var demographicBubble = dc.bubbleChart("#demographicBubble");

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

	function reduceAdd(p, v) {
		p.count++;

		if (zipDemoIndex[v.zip_code]) {
			p.people_per_acre = zipDemoIndex[v.zip_code].people_per_acre;
			p.median_income = zipDemoIndex[v.zip_code].median_income;
		} else {
			p.count = 0;
		}
		return p;
	}

	function reduceRemove(p, v) {
		p.count--;
		if (p.count == 0) {
			p.people_per_acre = 0;
			p.median_income = 0;
		}
		return p;
	}

	function reduceInitial() {
		return {count: 0};
	}

    var demographicBubbleCount = demographicBubblesDim.group().reduce(reduceAdd, reduceRemove, reduceInitial);

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

    var peopleExtent = d3.extent(nycZipDemographics, function (d) {
	    	return d.people_per_acre;
	    });
	var peopleScale = d3.scale.linear().domain([peopleExtent[0],peopleExtent[1]]);


    var incomeExtent = d3.extent(nycZipDemographics, function (d) {
	    	return d.median_income;
	    });
	var incomeScale = d3.scale.linear().domain([incomeExtent[0],incomeExtent[1]]);


    // Determine the first and last dates in the data set
    var monthExtent = d3.extent(rawData, function (d) {
        return d.created_date;
    });

    var timeScale = d3.time.scale()
        .domain([monthExtent[0], monthExtent[1]])
        .nice(d3.time.month);

    var shortMonthTickFormat = d3.time.format.multi([
        ["%b", function (d) {
            return d.getMonth();
        }],
        ["%Y", function () {
            return true;
        }]
    ]);

    // Compute the bounds of a feature of interest, then derive scale & translate.
    var b = path.bounds(nycZipJson),
        s = 0.95 / Math.max((b[1][0] - b[0][0]) / mapSize.width, (b[1][1] - b[0][1]) / mapSize.height),
        t = [(mapSize.width - s * (b[1][0] + b[0][0])) / 2, (mapSize.height - s * (b[1][1] + b[0][1])) / 2];

    // Update the projection to use computed scale & translate.
    projection
        .scale(s)
        .translate(t);

    choropleth.width(mapSize.width)
        .height(mapSize.height)
        .dimension(zipCodes)
        .group(zipCodeCounts, "Rat Sightings by Zip Code")
        .colors(colorScale)
        .colorAccessor(function (d) {
            return d.value;
        })
        .colorCalculator(function (d) {
            return d ? choropleth.colors()(d) : 'lightgray';
        })
        .overlayGeoJson(nycZipJson.features, "zip_code", function (d) {
            return d.properties.ZIP;
        })
        .projection(projection)
        .title(function (d) {
        	var name = zipDemoIndex[d.key] ? zipDemoIndex[d.key].name : d.key;
            return "Zip Code: " + name + "\nNumber of Sightings: " + d.value;
        });

    choropleth.calculateColorDomain();

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

    histogram.width(histSize.width)
        .height(histSize.height)
        .margins({
            top: 10,
            right: 10,
            bottom: 20,
            left: 40
        })
        .dimension(time)
        .group(timeCounts)
        .x(timeScale)
        .round(d3.time.month.round)
        .xUnits(d3.time.months)
        .elasticY(true)
        .renderHorizontalGridLines(true);

    histogram.xAxis().tickFormat(shortMonthTickFormat);

    boroughRow
        .width(boroughSize.width)
        .height(boroughSize.height)
        .dimension(borough)
        .group(boroughCounts)
        .elasticX(true)
        .ordering(function (d) {
            return -d.value;
        });

    boroughRow.xAxis().ticks(5);
    boroughRow.margins().right = 5;
    boroughRow.margins().left = 5;

    typeRow
        .width(typeSize.width)
        .height(typeSize.height)
        .dimension(type)
        .group(typeCounts)
        .elasticX(true)
        .ordering(function (d) {
            return -d.value;
        });

    typeRow.xAxis().ticks(5);
    typeRow.margins().right = 5;
    typeRow.margins().left = 5;

    topZipCodes
        .width(topZipCodesSize.width)
        .height(topZipCodesSize.height)
        .dimension(topZipCodesDim)
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
        .elasticX(true)
        .ordering(function (d) {
            return -d.value;
        });

    topZipCodes.xAxis().ticks(5);
    topZipCodes.margins().right = 5;
    topZipCodes.margins().left = 5;

    demographicBubble
    	.dimension(demographicBubblesDim)
    	.group(demographicBubbleCount)
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
        .yAxisLabel('Median Income (in $2012)')
        .label(function (p) {
            return p.key;
        })
        .renderTitle(true) // (optional) whether chart should render titles, :default = false
        .title(function (p) {
            return ["Zip Code:" + (zipDemoIndex[p.key] ? zipDemoIndex[p.key].name : p.key),
            	   "Rodent Complaints: " + p.value.count,
                   "Pop. Density: " + p.value.people_per_acre,
                   "Median Income: $" + p.value.median_income]
                   .join("\n");
        })
        .r(d3.scale.linear().domain([0, 2000]));


    var updateChloroplethScale = function (chart, filter) {
        var domain = [d3.min(choropleth.group().all(), choropleth.colorAccessor()),
            d3.max(choropleth.group().all(), choropleth.colorAccessor())];
        choropleth.colorDomain(domain);
    };

    boroughRow.on('filtered', updateChloroplethScale);
    typeRow.on('filtered', updateChloroplethScale);
    histogram.on('filtered', updateChloroplethScale);

    choropleth.renderlet(function (chart) {
        d3.select('#legend').selectAll('li.key')
            .data(chart.colors().range())
            .text(function (d) {
                var r = chart.colors().invertExtent(d);
                return formatCount(r[0]);
            });

    });

    resize();
}

function resize() {
    var mapSize = calculateSvgSize('#choropleth', margin, 1.2);
    choropleth.height(mapSize.height).width(mapSize.width);

    var histSize = calculateSvgSize('#histogram', margin, 0.33);
    histogram.height(histSize.height).width(histSize.width);
    histogram.xAxis().ticks(Math.max(histSize.width / 50, 2));
    histogram.yAxis().ticks(Math.max(histSize.height / 50, 2));

    var boroughSize = calculateSvgSize('#boroughRow', margin, 1);
    boroughRow.height(boroughSize.height).width(boroughSize.width);
    boroughRow.xAxis().ticks(Math.max(boroughSize.width / 50, 2));

    var typeSize = calculateSvgSize('#typeRow', margin, 1);
    typeRow.height(typeSize.height).width(typeSize.width);
    typeRow.xAxis().ticks(Math.max(typeSize.width / 50, 2));

    var topZipCodesSize = calculateSvgSize('#topZipCodes', margin, 1);
    topZipCodes.height(topZipCodesSize.height).width(topZipCodesSize.width);
    topZipCodes.xAxis().ticks(Math.max(topZipCodesSize.width / 50, 2));

    var demographicBubbleSize = calculateSvgSize('#demographicBubble', margin, 0.33);
    demographicBubble.height(demographicBubbleSize.height).width(demographicBubbleSize.width);
    demographicBubble.xAxis().ticks(Math.max(demographicBubbleSize.width / 50, 2));
    demographicBubble.yAxis().ticks(Math.max(histSize.height / 50, 2));

    dc.renderAll();
}

d3.select(window).on('resize', resize);
