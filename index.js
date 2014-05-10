/**
 * Assemble
 *
 * Assemble <http://assemble.io>
 * Created and maintained by Jon Schlinkert and Brian Woodward
 *
 * Copyright (c) 2014 Upstage.
 * Licensed under the MIT License (MIT).
 */

// Node.js
var path = require('path');

// node_modules
var glob = require('globule');
var boson = require('boson');
var async = require('async');
var _ = require('lodash');

// local modules
var events = require('./events');
var Middleware = require('./middleware');

// return true if a direct match or a wildcard match
var isEventMatch = function (a, b) {
  return (a === b) || a === '*';
};


var Dovetail = module.exports = function (app, logger) {
  this.eventCache = {};
  this.cache = {};

  this.app = app;
  this.logger = logger;

  // make sure each instance has access to events in case something else needs them
  this.events = events;
};

Dovetail.events = events;

Dovetail.prototype.setEventCache = function (event, middleware) {
  (this.eventCache[event] = this.eventCache[event] || []).push(middleware);
};

Dovetail.prototype.getEventCache = function (event) {
  return (this.eventCache[event] || []);
};

Dovetail.prototype.setCache = function (name, middleware) {
  this.cache[name] = middleware;
};

Dovetail.prototype.getCache = function (name) {
  return this.cache[name];
};

Dovetail.prototype.expandEvents = function (middlewareEvents) {
  if (!_.isArray(middlewareEvents)) {
    middlewareEvents = [middlewareEvents];
  }

  return _.filter(events.all(), function (event) {
    var eventParts = event.split(':');
    var isMatch = false;
    _.map(middlewareEvents, function (middlewareEvent) {
      var middlewareParts = middlewareEvent.split(':');
      isMatch = isMatch || (isEventMatch(middlewareParts[0], eventParts[0]) &&
        isEventMatch(middlewareParts[1], eventParts[1]) &&
        isEventMatch(middlewareParts[2], eventParts[2]));
    });
    return isMatch;
  });
};

Dovetail.prototype.addListeners = function (events, middleware) {
  var self = this;
  // setup a listener for each event this middleware registered
  events = self.expandEvents(events);
  events.forEach(function (event) {
    self.setEventCache(event, middleware);
    //middleware.listen(event);
  });
};


Dovetail.prototype.use = function (fn, options) {

  options = _.extend({}, options);

  // name must be provided
  if (!options.name || !_.isString(options.name)) {
    throw new Error('Must supply the name parameter.');
  }

  var name = options.name;

  // name must be unique
  if (this.getCache(name)) {
    throw new Error('A middleware with the name (' + name + ') already exists.');
  }

  // function must be provided
  if (!fn) {
    throw new Error('[Error loading middleware (' + name + ')] Must supply a function parameter.');
  }

  options.app = this.app;
  options.logger = this.logger;
  var middleware = new Middleware(fn, options);

  var events = (fn.options && (fn.options.event || fn.options.events)) || options.event || options.events || [];
  this.addListeners(events, middleware);
  this.setCache(name, middleware);
  return middleware;
};

/**
 * Find middleware and load them based on the list of middleware
 * @param  {[type]} app     [description]
 * @param  {[type]} _middleware [description]
 * @param  {[type]} options  [description]
 * @return {[type]}          [description]
 */
Dovetail.prototype.resolve = function (_middleware) {
  var self = this;
  var actualMiddleware = boson(_middleware, self.app);
  // set middleware options
  return _.map(_.keys(actualMiddleware), function (key) {
    var middleware = actualMiddleware[key];
    middleware.options = middleware.options || {};
    // options could be directly on the middleware object
    var options = middleware.options;
    options.event = options.event || (options.event = middleware.options.events || middleware.event || middleware.events || 'default');
    options.name = options.name || middleware.name || key;
    options.app = options.app || middleware.app || self.app;
    options.logger = options.logger || middleware.logger  || self.logger;
    return self.use(middleware, options);
  });
};

Dovetail.prototype.run = function (params, done) {
  var self = this;
  var allEvents = events.all();
  async.forEachSeries(_.keys(allEvents), function (key, next) {
      var event = allEvents[key];
      self.runevent(event, params, next);
    },
    function (err) {
      if (err) {
        self.logger.error(err);
        done();
      } else {
        done();
      }
    });
};

Dovetail.prototype.runEvent = function (event, params, done) {
  var self = this;
  var eventCache = self.getEventCache(event);
  if (eventCache && eventCache.length) {
    params = _.extend({event: event}, params);
    async.eachSeries(eventCache,
      function (middleware, next) {
        middleware.run(params, next);
      },
    done);

  } else {
    done();
  }
};
