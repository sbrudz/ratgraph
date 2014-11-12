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
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;
    return {
        height: height,
        width: width
    };
}
