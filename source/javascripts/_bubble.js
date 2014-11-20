//= require "_core"

ratgraph.bubble = function (id, dimension, group, demographics) {
	"use strict";

	var _id = id;
	var _chart = dc.bubbleChart(id);
	var _dimension = dimension;
	var _group = group;

	var _formatIncomeAxis = d3.format("$s");
	var _incomeFormat = d3.format("$.3s");
	var _formatCount = d3.format(",.0f");
	var _formatPercentageAxis = d3.format(".1f");

	var _peopleScale = d3.scale.linear(),
		_incomeScale = d3.scale.linear(),
		_percentageScale = d3.scale.linear().domain([0,100]);

	var _scaleMetadata = {
		'density': {
			'label': 'Population Density (people per acre)',
			'scale': _peopleScale,
			'tickFormat': _formatCount,
			'accessor': function (d) {
	            return d.value.people_per_acre;
	        }
		},
		'income': {
			'label': 'Median Household Income',
			'scale': _incomeScale,
			'tickFormat': _formatIncomeAxis,
			'accessor': function (d) {
	            return d.value.median_income;
	        }
		},
		'education': {
			'label': 'Percentage Who Didn\'t Graduate High School',
			'scale': _percentageScale,
			'tickFormat': _formatPercentageAxis,
			'accessor': function (d) {
	            return d.value.percent_low_education;
	        }
		},
		'vacancy': {
			'label': 'Percentage of Vacant Housing Units',
			'scale': _percentageScale,
			'tickFormat': _formatPercentageAxis,
			'accessor': function (d) {
	            return d.value.percent_vacant_units;
	        }
		},
		'unit_age': {
			'label': 'Percentage of pre-1950 Housing',
			'scale': _percentageScale,
			'tickFormat': _formatPercentageAxis,
			'accessor': function (d) {
	            return d.value.percent_pre1950_units;
	        }
		}
	};

	var _initScales = function(demographics) {
	    var peopleExtent = d3.extent(demographics, function (d) {
		    	return d.people_per_acre;
		    });
		_peopleScale.domain([peopleExtent[0],peopleExtent[1]]);

	    var incomeExtent = d3.extent(demographics, function (d) {
		    	return d.median_income;
		    });
		_incomeScale.domain([incomeExtent[0],incomeExtent[1]]);

	};

	_chart._init = function(demographics) {

		_initScales(demographics);

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
	        .colors(colorScale)
	        .colorAccessor(function (d) {
	            return d.value.count;
	        })
	        .elasticX(true)
	        .elasticY(true)
	        .maxBubbleRelativeSize(0.05)
	        .yAxisPadding('10%')
	        .xAxisPadding('10%')
	        .renderHorizontalGridLines(true)
	        .renderVerticalGridLines(true)
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
	        .r(d3.scale.linear().domain([0, 2000]));

        setXAxis(d3.select("#xSelect").node().value);
        setYAxis(d3.select("#ySelect").node().value);

	    d3.select("#topSelect").on("change", _chart.changeTopZipCodeSelection);
	    d3.select("#xSelect").on("change", _chart.changeXAxisDomain);
	    d3.select("#ySelect").on("change", _chart.changeYAxisDomain);

	    d3.select(window).on('resize.bubble', _chart.resize);

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

	_chart.changeTopZipCodeSelection = function () {
		_chart.redraw();
	};

	var setXAxis = function (selectedStat) {
		var selectedMetadata = _scaleMetadata[selectedStat];
		_chart.keyAccessor(selectedMetadata['accessor']);
		_chart.xAxisLabel(selectedMetadata['label']);
		_chart.x(selectedMetadata['scale']);
		_chart.elasticX(true);
		_chart.xAxis().tickFormat(selectedMetadata['tickFormat']);
	};

	var setYAxis = function (selectedStat) {
		var selectedMetadata = _scaleMetadata[selectedStat];
		_chart.valueAccessor(selectedMetadata['accessor']);
		_chart.yAxisLabel(selectedMetadata['label']);
		_chart.y(selectedMetadata['scale']);
		_chart.elasticY(true);
		_chart.yAxis().tickFormat(selectedMetadata['tickFormat']);
	};

	_chart.changeYAxisDomain = function () {
		var selectedStat = this.value;
		setYAxis(selectedStat);
		_chart.render();
	};

	_chart.changeXAxisDomain = function () {
		var selectedStat = this.value;
		setXAxis(selectedStat);
		_chart.render();
	};

	return _chart._init(demographics)._calculateSize();
};
