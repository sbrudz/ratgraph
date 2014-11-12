
describe('ratgraph core test suite', function () {
	var fixture;
	var fixture_class = 'test';

	beforeEach(function() {
		fixture = d3.select('body').append('div').classed(fixture_class, true);
	});

	afterEach(function() {
		fixture.remove();
	});

	it('should provide the ratgraph namespace', function () {
		expect(ratgraph).toBeDefined();
	});	

	it('should have default margins', function () {
		expect(ratgraph.margins).toBeDefined();
		expect(ratgraph.margins.top).toBeGreaterThan(0);
		expect(ratgraph.margins.bottom).toBeGreaterThan(0);
		expect(ratgraph.margins.left).toBeGreaterThan(0);
		expect(ratgraph.margins.right).toBeGreaterThan(0);
	});

	describe('calculateSvgSize method', function () {

		it('should calculate the height based on the width and aspect ratio', function () {
			var emptyMargins = { top: 0, bottom: 0, left: 0, right: 0 };
			var aspectRatio = 2;
			
			var fixtureWidth = parseInt(fixture.style('width'));
			expect(fixtureWidth).toBeGreaterThan(0);

			var size = ratgraph.calculateSvgSize('.'+fixture_class, emptyMargins, aspectRatio);
			
			expect(size).toBeDefined();
			expect(size.width).toBe(fixtureWidth);
			expect(size.height).toBe(fixtureWidth*aspectRatio);
		});

		it('should take the margins into account in its calculations', function () {
			var aspectRatio = 2;
			var fixtureWidth = parseInt(fixture.style('width'));
			expect(fixtureWidth).toBeGreaterThan(0);

			var size = ratgraph.calculateSvgSize('.'+fixture_class, ratgraph.margins, aspectRatio);
			
			expect(size).toBeDefined();
			expect(size.width).toBe(fixtureWidth - ratgraph.margins.left - ratgraph.margins.right);
			expect(size.height).toBe(fixtureWidth*aspectRatio - ratgraph.margins.top - ratgraph.margins.bottom);

		});

	});

});