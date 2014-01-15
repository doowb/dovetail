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
var defaultLog = function () {
  console.log.call(null, arguments);
};

var defaultLogger = {
 debug : defaultLog,
 info : defaultLog,
 warning : defaultLog,
 error : defaultLog,
 critical : defaultLog
};

var Plugin = module.exports = function (name, description, options, fn, app, logger) {
    events.EventEmitter.call(this);

    this.options = options || {};
    this.log = logger || defaultLogger;

    this.name = name;
    this.description = description;
    this.fn = fn;
    this.app = app;

    if (app.name && app.name.length > 0) {
      this[app.name] = app;
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
  params = params.options || this.options || {};
  params = params.name || this.name || '';
  params = params.description || this.description || '';
  params = params.fn || this.fn || function () {};
  params = params.app || this.app;

  if (this.app.name && this.app.name.length > 0) {
    params[this.app.name] = this[this.app.name];
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