ratgraph
========

## Overview

[ratgraph](https://sbrudz.github.io/ratgraph/) is an interactive visualization of rat and rodent sightings in NYC based on data from the NYC Open Data portal.

## Development

* Install the ruby version specified in the .ruby-version file
* Make sure that bundler.io is installed
* Run `bundle install` in the root of the project directory
* Run `bundle exec middleman server` to start the development server

## Deployment

Ratgraph lives on GitHub pages and uses the [middleman-gh-pages](https://github.com/neo/middleman-gh-pages) gem from Neo Innovation for publishing.  To deploy an update, run:
```
rake publish
```

## Technology

The visualization is based on the following javascript libraries:
* [d3.js](http://d3js.org/) -- data-driven charts library
* [dc.js](http://dc-js.github.io/dc.js/) -- a library of d3 chart components integrated with crossfilter
* [crossfilter.js](http://square.github.io/crossfilter/) -- a library from square that allows filtering a large data set across many dimensions
* [leaflet.js](http://leafletjs.com/) -- a mapping library
* [Stamen toner-lite](https://github.com/Citytracking/toner) -- black and white tiles for the map
* My [customized version](https://github.com/sbrudz/dc.leaflet.js) of the the dc.js leaflet component, originally created by [yurukov](https://github.com/yurukov/dc.leaflet.js) and further enhanced by [monostop](https://github.com/monostop/dc.leaflet.js) -- a component that combines a dc.js choropleth with leaflet.js.
* [spin.js](http://fgnass.github.io/spin.js/) -- a library that provides the waiting spinner

HTML5 and SASS / CSS are used for content and layout.  It uses [Middleman](http://middlemanapp.com/) to handle static site generation and [bourbon.io](http://bourbon.io/) for SASS mix-ins to make using the flexbox layout easier.

For testing, I'm using [jasmine](http://jasmine.github.io/2.0/introduction.html).

## Roadmap

* Support entering your zip code to quickly see all sighting data for your area
* Plot individual rat sightings on the map when zoomed in
* Add in results of rat inspection reports
* Setup a nightly batch job to pull in the latest sighting data

## Credits
* Thanks to Cyrus Innovation and Occom for supporting work on this project
* Thanks to Jon Roberts for his <a href="https://github.com/jonroberts/d3Mapping">NYC Zip Code Map geoJSON</a>.
* Thanks to the city of New York for providing their 311 data to the public in an easily accessible format
