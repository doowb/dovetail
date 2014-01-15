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
plugins.stages = {};

plugins.addStages = function (stages) {
  _.map(_.keys(stages), function (key) {
    plugins.stages[key] = stages[key];
  });  
};

plugins.addStage = function (key, value) {
  plugins.stages[key] = value;
};

plugins.removeStage = function (key) {
  if (plugins.stages[key]) {
    delete plugins.stages[key];
  }
};