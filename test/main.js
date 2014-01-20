/**
 * Pluggable
 * Copyright (c) 2014 Jon Schlinkert, Brian Woodward, contributors
 * Licensed under the MIT License (MIT).
 */

var expect = require('chai').expect;
var _ = require('lodash');
var events = require('events');

var Dovetail = require('../');

// test app - inherit from EventEmiteter
var App = function() {
  events.EventEmitter.call(this);
  this.appName = 'test-app';
};

require('util').inherits(App, events.EventEmitter);

describe('Dovetail', function() {

  before(function(){
    // run any code before tests here
  });

  it('should create and run a plugin', function(done) {

    // add a test stage
    Dovetail.plugins.addStage('first', 'first');

    var app = new App();
    var dovetail = new Dovetail(app);

    // add a new plugin
    dovetail.createPlugin('test-plugin', 'this is just a test', { stage: 'first' }, function (params, next) {
      console.log('params', params);
      next();
    });

    // run the plugin
    dovetail.runStage('first', { foo: 'bar' }, done);
  });

});