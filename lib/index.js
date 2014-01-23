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

var isStageMatch = function (a, b) {
  return (a === b) || a === '*';
};

var Dovetail = module.exports = function (app, logger) {
  this.stageCache = {};
  this.cache = {};

  this.app = app;
  this.logger = logger;
};

Dovetail.plugins = plugins;

Dovetail.prototype.setStageCache = function (stage, plugin) {
  (this.stageCache[stage] = this.stageCache[stage] || []).push(plugin);
};

Dovetail.prototype.getStageCache = function (stage) {
  return (this.stageCache[stage] || []);
};

Dovetail.prototype.setCache = function (name, plugin) {
  this.cache[name] = plugin;
};

Dovetail.prototype.getCache = function (name) {
  return this.cache[name];
};

Dovetail.prototype.expandStages = function (pluginStages) {
  if (!_.isArray(pluginStages)) {
    pluginStages = [pluginStages];
  }

  return _.filter(plugins.stages, function (stage) {
    var stageParts = stage.split(':');
    var isMatch = false;
    _.map(pluginStages, function (pluginStage) {
      var pluginParts = pluginStage.split(':');
      isMatch = isMatch || (isStageMatch(pluginParts[0], stageParts[0]) &&
        isStageMatch(pluginParts[1], stageParts[1]) &&
        isStageMatch(pluginParts[2], stageParts[2]));
    });
    return isMatch;
  });
};

Dovetail.prototype.addListeners = function (stages, plugin) {
  var self = this;
  // setup a listener for each stage this plugin registered
  stages = self.expandStages(stages);
  stages.forEach(function (stage) {
    self.setStageCache(stage, plugin);
    plugin.listen(stage);
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

  var stages = (fn.options && (fn.options.stage || fn.options.stages)) || options.stage || options.stages || [];
  this.addListeners(stages, plugin);
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
        var fullPath = path.normalize(path.join(options.cwd || process.cwd() || '', relPath));
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
    plugin.options.stage = plugin.options.stage || (plugin.options.stage = plugin.options.stages || plugins.stages.renderPrePage);
    plugin(self.app);
  });
};

Dovetail.prototype.run = function (params, done) {
  var self = this;
  async.forEachSeries(_.keys(plugins.stages), function (key, next) {
      var stage = plugins.stages[key];
      self.runStage(stage, params, next);
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

Dovetail.prototype.runStage = function (stage, params, done) {
  var self = this;
  var stageCache = self.getStageCache(stage);
  if (stageCache && stageCache.length) {

    ewait.waitForAll(stageCache, function (err) {
      if (err) {
        self.logger.error(err);
      }
      done();
    });

    params = _.extend({stage: stage}, params);
    self.app.emit(stage, params);
  } else {

    done();
  }
};