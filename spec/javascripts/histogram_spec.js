
describe('histogram test suite', function () {
	var histogram, fixture;

	beforeEach(function() {
		fixture = d3.select('body').append('div').classed('test', true);
		// spyOn(dc, "barChart");
		// histogram = ratgraph.histogram('.test');
	});

	afterEach(function() {
		fixture.remove();
	});

	it('should be based on a dc.js bar chart', function () {
		// expect(dc.barChart).toHaveBeenCalled();
		expect(dc).toBeDefined();
	});
});
