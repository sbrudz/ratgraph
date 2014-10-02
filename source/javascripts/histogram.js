
// Thanks to http://stackoverflow.com/questions/17745682/d3-histogram-date-based

var margin = {top: 30, right: 20, bottom: 30, left: 50},
    width = 1200 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var parseDate = d3.time.format("%m/%d/%Y %I:%M:%S %p").parse;
var formatDate = d3.time.format("%m/%y");
var formatCount = d3.format(",.0f");

var x = d3.time.scale().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().scale(x)
  .orient("bottom").tickFormat(formatDate);

var yAxis = d3.svg.axis().scale(y)
  .orient("left").ticks(6);

var svg = d3.select("div#d3_histogram")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.csv("data/Rat_Sightings.csv", function(error, data) {
  data.forEach(function(d) {
    d.created_date = parseDate(d["Created Date"]);
  });

  var monthExtent = d3.extent(data, function(d) { return d.created_date; });
  var monthBins = d3.time.months(d3.time.month.offset(monthExtent[0],-1),
                                 d3.time.month.offset(monthExtent[1],1));

  var histData = d3.layout.histogram()
    .value(function(d) { return d.created_date; })
    .bins(monthBins)
    (data);

  // Scale the range of the data
  x.domain(d3.extent(monthBins));
  y.domain([0, d3.max(histData, function(d) { return d.y; })]);

  var bar = svg.selectAll(".bar")
      .data(histData)
   .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + (x(d.x)) + "," + y(d.y) + ")"; });

  bar.append("rect")
      .attr("x", 1)
      .attr("width", x(new Date(histData[0].x.getTime() + histData[0].dx))-5)
      .attr("height", function(d) { return height - y(d.y); });

  // Add the X Axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  // Add the Y Axis
  svg.append("g")
     .attr("class", "y axis")
     .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Number of Sightings");

  var graph = new Rickshaw.Graph({
        element: document.querySelector("#rickshaw_histogram"),
        renderer: 'bar',
        series: [{
                data: histData.map(function(d) { var pair = {}; pair["x"] = +d.x; pair["y"] = d.y; return pair; }),
                color: 'steelblue'
        }]
  });
  var axes = new Rickshaw.Graph.Axis.Time( { graph: graph } );
  graph.render();

});
