/**
 * Assemble
 *
 * Assemble <http://assemble.io>
 * Created and maintained by Jon Schlinkert and Brian Woodward
 *
 * Copyright (c) 2014 Upstage.
 * Licensed under the MIT License (MIT).
 */

var path = require('path');

var resolve = require('resolve-dep');
var glob = require('globule');
var ewait = require('ewait');
var async = require('async');
var _ = require('lodash');

var plugins = require('./plugins');
var Plugin = require('./plugin');

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

Dovetail.prototype.createPlugin = function (name, description, options, fn) {

  // name must be provided
  if (!name || !_.isString(name)) {
    throw new Error('Must supply the name parameter.');
  }

  // name must be unique
  if (this.getCache(name)) {
    throw new Error('A plugin with the name (' + name + ') already exists.');
  }

  // if description is an object, then it's the options
  if (description && _.isObject(description)) {
    fn = options;
    options = description;
    description = '';
  }

  // if options is a function, then it's the callback
  if (options && _.isFunction(options)) {
    fn = options;
    options = {};
  }

  // function must be provided
  if (!fn) {
    throw new Error('[Error loading plugin (' + name + ')] Must supply a function parameter.');
  }

  var plugin = new Plugin(name, description, options, fn, this.app, this.logger);

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
Dovetail.prototype.resolve = function (_plugins, options) {
  var self = this;
  options = options || {};
  _plugins = _plugins || [];
  if (!_.isArray(_plugins)) {
    _plugins = [_plugins];
  }
  var actualPlugins = [];

  _plugins.forEach(function (plugin) {
    // if plugin is a string, attempt to resolve to module
    if (_.isString(plugin)) {
      var resolved = resolve.all(plugin);
      // if resolved to an npm module then use it, otherwise assume local file/pattern so expand
      var relPaths = resolve.length ? resolved : glob.find(plugin);
      var resolvedPlugins = relPaths.map(function (relPath) {
        // normalize the relative path given current working directory
        var fullPath = path.normalize(path.join(process.cwd(), relPath));
        try {
          var required = require(fullPath);
          return required;
        } catch (ex) {
          self.logger.error('Error requiring plugin "' + plugin + '"');
          self.logger.error(ex);
        }
      });
      actualPlugins = actualPlugins.concat(resolvedPlugins || []);
    }
    // otherwise, assume plugin is already a function
    else {
      actualPlugins.push(plugin);
    }
  });

  // set plugin options
  _.map(actualPlugins, function (plugin) {
    plugin.options = plugin.options || {};
    plugin.options.event = plugin.options.event || (plugin.options.event = plugin.options.events || plugins.events.renderPrePage);
    plugin(self.app);
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