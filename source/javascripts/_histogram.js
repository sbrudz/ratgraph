//= require "_core"

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

	    d3.select(window).on('resize.histogram', _chart.resize);

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
