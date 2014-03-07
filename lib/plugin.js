/**
 * Assemble
 *
 * Assemble <http://www.assemble.com>
 * Created and maintained by Jon Schlinkert and Brian Woodward
 *
 * Copyright (c) 2014 Upstage.
 * Licensed under the MIT License (MIT).
 */

// Node.js
var events = require('events');

// node_modules
var _ = require('lodash');

// local modules
var defaultLogger = require('./logger');

var defaults = {
  name: 'default',
  description: 'Plugin'
};

/**
 * Plugin class for setting up and calling plugin
 * functions
 * @param  {Function} fn        The actual function that will get called when the plugin is run.
 * @param  {Object}   options   Options containing the following information
 *                                name        Name of the plugin
 *                                description Human readable description of the plugin
 *                                app         The application this plugin is running in
 *                                logger      The logger used in an instance of this plugin class
 */
var Plugin = module.exports = function (fn, options) {
    events.EventEmitter.call(this);

    this.options = _.extend({}, defaults, options);
    this.log = this.options.logger || defaultLogger;

    this.name = this.options.name;
    this.description = this.options.description;
    this.fn = fn;
    this.app = this.options.app;

    if (this.app.appName && this.app.appName.length > 0) {
      this[this.app.appName] = this.app;
    }
};

require('util').inherits(Plugin, events.EventEmitter);

Plugin.prototype.listen = function (event) {
  this.app.on(event, this.run.bind(this));
};

/**
 * Run the plugin when the event is emitted.
 * @param  {[type]} params [description]
 * @return {[type]}        [description]
 */
Plugin.prototype.run = function (params) {

  // add local properties to the params
  params.options = params.options || this.options || {};
  params.name = params.name || this.name || '';
  params.description = params.description || this.description || '';
  params.fn = params.fn || this.fn || function () {};
  params.app = params.app || this.app;

  if (this.app.appName && this.app.appName.length > 0) {
    params[this.app.appName] = this[this.app.appName];
  }

  this.log.info('Plugin "' + this.name + '" starting...');
  this.fn.call(this.app, params, this.done.bind(this));
};

/**
 * Called when the plugin is finished
 * @param  {[type]}   err [description]
 * @return {Function}     [description]
 */
Plugin.prototype.done = function (err) {
  this.log.info(['Plugin "' + this.name + '" finished.']);
  if (err) {
    this.emit('error', new Error(err));
  }
  this.emit('done');
};