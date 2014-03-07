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

    // add a test event
    Dovetail.plugins.addEvent('first', 'first');

    var app = new App();
    var dovetail = new Dovetail(app);
    var plugin = function (params, next) {
      next();
    };
    var options = {
      name: 'test-plugin',
      description: 'this is just a test',
      event: 'first'
    };

    // add a new plugin
    dovetail.createPlugin(plugin, options);

    // run the plugin
    dovetail.runEvent('first', { foo: 'bar' }, done);
  });

});