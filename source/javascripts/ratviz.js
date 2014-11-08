//= require "_choropleth"
//= require "_histogram"
//= require "_bubble"

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
