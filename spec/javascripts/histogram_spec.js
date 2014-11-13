
describe('ratgraph histogram', function () {
	var histogram, fixture, chainedMethods,
		dimensionStub, chart, axis;

	beforeEach(function() {
		fixture = d3.select('body').append('div').classed('test', true);

		dimensionStub = {
			bottom: function (_) { return [{createdDate:''}]; },
			top: function(_) { return [{createdDate:''}]; }
		};
		chainedMethods = ['margins', 'dimension', 'group', 'x', 'round', 'xUnits', 'elasticY', 'yAxisLabel', 'renderHorizontalGridLines', 'height', 'width'];
		chart = jasmine.createSpyObj('chart', chainedMethods.concat(['xAxis','yAxis']));
		chainedMethods.forEach(function (methodName) {
			chart[methodName].and.returnValue(chart);
		});
		axis = jasmine.createSpyObj('axis', ['tickFormat','ticks']);
		chart['xAxis'].and.returnValue(axis);
		chart['yAxis'].and.returnValue(axis);

		spyOn(dc, "barChart").and.returnValue(chart);

		histogram = ratgraph.histogram('.test', dimensionStub);
	});

	afterEach(function() {
		fixture.remove();
	});

	it('should be based on a dc.js bar chart', function () {
		expect(dc.barChart).toHaveBeenCalled();
		expect(dc).toBeDefined();
	});

	it('should call all chained methods', function () {
		chainedMethods.forEach(function (methodName) {
			expect(chart[methodName]).toHaveBeenCalled();
		});
	});

	it('should set up the axes', function () {
		expect(chart.xAxis).toHaveBeenCalled();
		expect(chart.yAxis).toHaveBeenCalled();	
		expect(axis.tickFormat).toHaveBeenCalled();
		expect(axis.ticks).toHaveBeenCalled();
		expect(axis.ticks.calls.count()).toBe(2);	
	});
});
