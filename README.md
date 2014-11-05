ratgraph
========

## Overview

[ratgraph](http://ratgraph.nyc) is an interactive visualization of rat and rodent sightings in NYC based on data from the NYC Open Data portal.

## Deployment

Ratgraph lives on GitHub pages and uses the [middleman-gh-pages](https://github.com/neo/middleman-gh-pages) gem from Neo Innovation for publishing.  To deploy an update, run:
```
rake publish
```

## Technology

The visualization is based on the following javascript libraries:
* http://d3js.org/
* http://dc-js.github.io/dc.js/
* http://square.github.io/crossfilter/

HTML5 and SASS / CSS are used for content and layout.  It uses [Middleman](http://middlemanapp.com/) to handle static site generation and [bourbon.io](http://bourbon.io/) for SASS mix-ins to make using the flexbox layout easier.

## Roadmap

* Add zooming and panning to the choropleth map
* Plot individual rat sightings on the map when zoomed in
* Add in average daily temperature data
* Add in results of rat inspection reports
* Setup a nightly batch job to pull in the latest sighting data

## Credits
* Thanks to Cyrus Innovation and Occom for supporting work on this project
* Thanks to Jon Roberts for his <a href="https://github.com/jonroberts/d3Mapping">NYC Zip Code Map geoJSON</a>.
* Thanks to the city of New York for providing their 311 data to the public in an easily accessible format
