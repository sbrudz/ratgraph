//= require "_core"

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
