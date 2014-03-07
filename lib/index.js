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
var ewait = require('ewait');
var async = require('async');
var _ = require('lodash');

// local modules
var plugins = require('./plugins');
var Plugin = require('./plugin');

// return true if a direct match or a wildcard match
var isEventMatch = function (a, b) {
  return (a === b) || a === '*';
};


var Dovetail = module.exports = function (app, logger) {
  this.eventCache = {};
  this.cache = {};

  this.app = app;
  this.logger = logger;
};

Dovetail.plugins = plugins;

Dovetail.prototype.setEventCache = function (event, plugin) {
  (this.eventCache[event] = this.eventCache[event] || []).push(plugin);
};

Dovetail.prototype.getEventCache = function (event) {
  return (this.eventCache[event] || []);
};

Dovetail.prototype.setCache = function (name, plugin) {
  this.cache[name] = plugin;
};

Dovetail.prototype.getCache = function (name) {
  return this.cache[name];
};

Dovetail.prototype.expandEvents = function (pluginEvents) {
  if (!_.isArray(pluginEvents)) {
    pluginEvents = [pluginEvents];
  }

  return _.filter(plugins.events, function (event) {
    var eventParts = event.split(':');
    var isMatch = false;
    _.map(pluginEvents, function (pluginEvent) {
      var pluginParts = pluginEvent.split(':');
      isMatch = isMatch || (isEventMatch(pluginParts[0], eventParts[0]) &&
        isEventMatch(pluginParts[1], eventParts[1]) &&
        isEventMatch(pluginParts[2], eventParts[2]));
    });
    return isMatch;
  });
};

Dovetail.prototype.addListeners = function (events, plugin) {
  var self = this;
  // setup a listener for each event this plugin registered
  events = self.expandEvents(events);
  events.forEach(function (event) {
    self.setEventCache(event, plugin);
    plugin.listen(event);
  });
};


Dovetail.prototype.createPlugin = function (fn, options) {

  options = _.extend({}, options);

  // name must be provided
  if (!options.name || !_.isString(options.name)) {
    throw new Error('Must supply the name parameter.');
  }

  var name = options.name;

  // name must be unique
  if (this.getCache(name)) {
    throw new Error('A plugin with the name (' + name + ') already exists.');
  }

  // function must be provided
  if (!fn) {
    throw new Error('[Error loading plugin (' + name + ')] Must supply a function parameter.');
  }

  options.app = this.app;
  options.logger = this.logger;
  var plugin = new Plugin(fn, options);

  var events = (fn.options && (fn.options.event || fn.options.events)) || options.event || options.events || [];
  this.addListeners(events, plugin);
  this.setCache(name, plugin);
  return plugin;
};

/**
 * Find plugins and load them based on the list of plugins
 * @param  {[type]} app     [description]
 * @param  {[type]} _plugins [description]
 * @param  {[type]} options  [description]
 * @return {[type]}          [description]
 */
Dovetail.prototype.resolve = function (_plugins) {
  var self = this;
  var actualPlugins = boson(_plugins, self.app);
  // set plugin options
  return _.map(_.keys(actualPlugins), function (key) {
    var plugin = actualPlugins[key];
    plugin.options = plugin.options || {};
    plugin.options.event = plugin.options.event || (plugin.options.event = plugin.options.events || 'default');
    plugin.options.name = plugin.options.name || key;
    plugin.options.app = plugin.options.app || self.app;
    plugin.options.logger = plugin.options.logger || self.logger;
    return self.createPlugin(plugin, plugin.options);
  });
};

Dovetail.prototype.run = function (params, done) {
  var self = this;
  async.forEachSeries(_.keys(plugins.events), function (key, next) {
      var event = plugins.events[key];
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
    ewait.waitForAll(eventCache, function (err) {
      if (err) {
        self.logger.error(err);
      }
      done();
    });
    params = _.extend({event: event}, params);
    self.app.emit(event, params);
  } else {
    done();
  }
};