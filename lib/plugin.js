/**
 * Assemble
 *
 * Assemble <http://www.assemble.com>
 * Created and maintained by Jon Schlinkert and Brian Woodward
 *
 * Copyright (c) 2014 Upstage.
 * Licensed under the MIT License (MIT).
 */

var events = require('events');
var defaultLogger = require('./logger');

var Plugin = module.exports = function (name, description, options, fn, app, logger) {
    events.EventEmitter.call(this);

    this.options = options || {};
    this.log = logger || defaultLogger;

    this.name = name;
    this.description = description;
    this.fn = fn;
    this.app = app;

    if (app.appName && app.appName.length > 0) {
      this[app.appName] = app;
    }
};

require('util').inherits(Plugin, events.EventEmitter);

Plugin.prototype.listen = function (stage) {
  this.app.on(stage, this.run.bind(this));
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
    // do something
  }
  this.emit('done');
};