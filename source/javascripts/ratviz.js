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
var boroughSize = calculateSvgSize('#boroughRow', margin, 1.2);
var typeSize = calculateSvgSize('#typeRow', margin, 1.2);
var topZipCodesSize = calculateSvgSize('#topZipCodes', margin, 1.2);
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

queue()
    .defer(d3.csv, "data/nyc_rodent_complaints_cleaned.csv")
    .defer(d3.json, "data/nyc-zip-code.json")
    .defer(d3.csv, "data/nyc-zip-demographics.csv")
    .await(ready);

function ready(error, rawData, nycZipJson, nycZipDemographics) {

    if (error) {
        console.warn(error);
    }

    rawData.forEach(function (d) {
        d.created_date = new Date(+d["Created Date"]);
    });

    var data = crossfilter(rawData),
    	all = data.groupAll();

    var zipCodes = data.dimension(function (d) {
        return d["Incident Zip"];
    });

    var zipCodeCounts = zipCodes.group();

    var topZipCodesDim = data.dimension(function (d) {
    	return d["Incident Zip"]
    });

    var topZipCodeCounts = topZipCodesDim.group();

    var time = data.dimension(function (d) {
        return d.created_date;
    });
    var timeCounts = time.group(function (d) {
        return d3.time.month(d);
    }).reduceCount();

    var borough = data.dimension(function (d) {
        return d["Borough"];
    });
    var boroughCounts = borough.group().reduceCount();

    var type = data.dimension(function (d) {
        return d["Descriptor"];
    });
    var typeCounts = type.group().reduceCount();

    // Create a map so we can quickly loop up demographic info by zip code
    var zipDemoIndex = {};
    nycZipDemographics.forEach(function (d) {
    	zipDemoIndex[d.zip_code] = d;
    });

    var peopleExtent = d3.extent(nycZipDemographics, function (d) {
	    	return d.people_per_acre;
	    });
	// var peopleScale = d3.scale.linear().domain([peopleExtent[0],peopleExtent[1]]);
	var peopleScale = d3.scale.linear().domain([0, 210]);


    var incomeExtent = d3.extent(nycZipDemographics, function (d) {
	    	return d.median_income;
	    });
	// var incomeScale = d3.scale.linear().domain([incomeExtent[0],incomeExtent[1]]);
	var incomeScale = d3.scale.linear().domain([0, 250000]);


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
            return "Zip Code: " + d.key + "\nNumber of Sightings: " + d.value;
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
        .elasticX(true)
        .ordering(function (d) {
            return -d.value;
        });

    topZipCodes.xAxis().ticks(5);
    topZipCodes.margins().right = 5;
    topZipCodes.margins().left = 5;

    demographicBubble
    	.dimension(zipCodes)
    	.group(zipCodeCounts)
    	.margins({top: 10, right: 50, bottom: 30, left: 80})
        .radiusValueAccessor(function (d) {
            return d.value;
        })
        .elasticRadius(true)
        .keyAccessor(function (d) {
        	if (!zipDemoIndex[d.key]) {
        		console.log("Missing zip: " + d.key);
        		return 0;
        	}
            return zipDemoIndex[d.key].people_per_acre;
        })
        .valueAccessor(function (d) {
        	if (!zipDemoIndex[d.key]) {
        		return 0;
        	}
            return zipDemoIndex[d.key].median_income;
        })
        .colors(colorScale)
        .colorAccessor(function (d) {
            return d.value;
        })
        .x(peopleScale)
        //.elasticX(true)
        .y(incomeScale)
        //.elasticY(true)
        .maxBubbleRelativeSize(0.1)
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

    var boroughSize = calculateSvgSize('#boroughRow', margin, 1.2);
    boroughRow.height(boroughSize.height).width(boroughSize.width);
    boroughRow.xAxis().ticks(Math.max(boroughSize.width / 50, 2));

    var typeSize = calculateSvgSize('#typeRow', margin, 1.2);
    typeRow.height(typeSize.height).width(typeSize.width);
    typeRow.xAxis().ticks(Math.max(typeSize.width / 50, 2));

    var topZipCodesSize = calculateSvgSize('#topZipCodes', margin, 1.2);
    topZipCodes.height(topZipCodesSize.height).width(topZipCodesSize.width);
    topZipCodes.xAxis().ticks(Math.max(topZipCodesSize.width / 50, 2));

    var demographicBubbleSize = calculateSvgSize('#demographicBubble', margin, 0.33);
    demographicBubble.height(demographicBubbleSize.height).width(demographicBubbleSize.width);
    demographicBubble.xAxis().ticks(Math.max(demographicBubbleSize.width / 50, 2));
    demographicBubble.yAxis().ticks(Math.max(histSize.height / 50, 2));

    dc.renderAll();
}

d3.select(window).on('resize', resize);
