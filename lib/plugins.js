/**
 * Sellside
 *
 * Sellside <http://www.sellside.com>
 * Created and maintained by Jon Schlinkert and Brian Woodward
 *
 * Copyright (c) 2014 Sellside.
 * Licensed under the MIT License (MIT).
 */

var _ = require('lodash');

var plugins = module.exports = {};

// plugin events that we emit
plugins.stages = {
  // optionsBeforeConfiguration: 'options:before:configuration',
  // optionsAfterConfiguration: 'options:after:configuration',
  // assembleBeforeLayout: 'assemble:before:layout',
  // assembleAfterLayout: 'assemble:after:layout',
  // assembleBeforePartials: 'assemble:before:partials',
  // assembleAfterPartials: 'assemble:after:partials',
  // assembleBeforeData: 'assemble:before:data',
  // assembleAfterData: 'assemble:after:data',
  // assembleBeforePages: 'assemble:before:pages',
  // assembleBeforePage: 'assemble:before:page',
  // assembleAfterPage: 'assemble:after:page',
  // assembleAfterPages: 'assemble:after:pages',
  // renderBeforePages: 'render:before:pages',
  // renderBeforePage: 'render:before:page',
  // renderAfterPage: 'render:after:page',
  // renderAfterPages: 'render:after:pages'
};

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