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

  it('should create and run a middleware', function(done) {

    // add a test event
    Dovetail.middleware.addEvent('first', 'first');

    var app = new App();
    var dovetail = new Dovetail(app);
    var middleware = function (params, next) {
      next();
    };
    var options = {
      name: 'test-middleware',
      description: 'this is just a test',
      event: 'first'
    };

    // add a new middleware
    dovetail.use(middleware, options);

    // run the middleware
    dovetail.runEvent('first', { foo: 'bar' }, done);
  });

});
