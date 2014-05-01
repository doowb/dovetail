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

  describe('general', function () {

    it('should create and run a middleware', function(done) {

      // add a test event
      Dovetail.events.add('first', 'first');

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


  describe('Options', function () {
    //var options = middleware.options || {};
    //options.event = options.event || (options.event = middleware.options.events || middleware.event || middleware.events || 'default');
    //options.name = options.name || middleware.name || key;
    //options.app = options.app || middeware.app || self.app;
    //options.logger = options.logger || middleware.logger  || self.logger;
    //return self.use(middleware, options);

    it('when event is on `options` it should load that event', function (done) {
      var app = new App();
      var dovetail = new Dovetail(app);
      dovetail.events.add('someRandomEvent', 'some:random:event');

      var middleware = function (params, next) {
        next();
      };
      middleware.options = {
        event: 'some:random:event'
      };
      dovetail.resolve({'test-middleware-2': middleware});
      dovetail.runEvent('some:random:event', { foo: 'baz'}, done);
    });

    it('when event is on the middleware it should load that event', function (done) {
      var app = new App();
      var dovetail = new Dovetail(app);
      dovetail.events.add('someRandomEvent3', 'some:random:event3');

      var middleware = function (params, next) {
        next();
      };
      middleware.event = 'some:random:event3';
      dovetail.resolve({'test-middleware-3': middleware});
      dovetail.runEvent('some:random:event3', { foo: 'baz'}, done);
    });

  });

});
