/**
 * Assemble
 *
 * Assemble <http://www.assemble.com>
 * Created and maintained by Jon Schlinkert and Brian Woodward
 *
 * Copyright (c) 2014 Upstage.
 * Licensed under the MIT License (MIT).
 */

var _ = require('lodash');

var plugins = module.exports = {};

// plugin events that we emit
plugins.events = {};

plugins.addEvents = function (events) {
  _.map(_.keys(events), function (key) {
    plugins.events[key] = events[key];
  });  
};

plugins.addEvent = function (key, value) {
  plugins.events[key] = value;
};

plugins.removeEvent = function (key) {
  if (plugins.events[key]) {
    delete plugins.events[key];
  }
};