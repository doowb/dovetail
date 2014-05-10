/**
 * Copyright (c) 2014 Brian Woodward, contributors.
 * Licensed under the MIT License (MIT).
 */

// node_modules
var _ = require('lodash');

// local modules
var defaultLogger = require('./logger');
var noop = function() {};

/**
 * Middleware class for setting up and calling
 * middleware functions
 *
 * @param  {Function} fn        Called when the middleware is run.
 * @param  {Object}   options   Object with any of these options:
 *    [name]    Name of the middleware
 *    [app]     The application this middleware is running in
 *    [logger]  The logger used in an instance of this middleware class
 */

function Middleware(fn, options) {
  this.options = _.extend({}, {name: 'middleware'}, options);
  this.log = this.options.logger || defaultLogger;

  this.name = this.options.name;
  this.app  = this.options.app;
  this.fn   = fn;

  if (this.app.appName && this.app.appName.length > 0) {
    this[this.app.appName] = this.app;
  }
};

// Middleware.prototype.listen = function (event) {
//   this.app.on(event, this.run.bind(this));
// };


/**
 * Run the middleware when the event is emitted.
 * @param  {[type]} params [description]
 * @return {[type]}        [description]
 */

Middleware.prototype.run = function (params, next) {

  // add local properties to the params
  params.options = params.options || this.options || {};
  params.name    = params.name    || this.name || '';
  params.app     = params.app     || this.app;
  params.fn      = params.fn      || this.fn || noop;

  if (this.app.appName && this.app.appName.length > 0) {
    params[this.app.appName] = this[this.app.appName];
  }

  this.log.info('  starting:', this.name);
  this.fn.call(this.app, params, this.done(next).bind(this));
};


/**
 * Called when the middleware is finished
 * @param  {[type]}   err [description]
 * @return {Function}     [description]
 */

Middleware.prototype.done = function (next) {
  return function (err) {
    this.log.info('  finished:', this.name);
    next(err);
  };
};


module.exports = Middleware;