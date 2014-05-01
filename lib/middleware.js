/**
 * Assemble
 *
 * Assemble <http://www.assemble.com>
 * Created and maintained by Jon Schlinkert and Brian Woodward
 *
 * Copyright (c) 2014 Upstage.
 * Licensed under the MIT License (MIT).
 */

// node_modules
var _ = require('lodash');

// local modules
var defaultLogger = require('./logger');

var defaults = {
  name: 'default',
  description: 'Middleware'
};

/**
 * Middleware class for setting up and calling middleware
 * functions
 * @param  {Function} fn        The actual function that will get called when the middleware is run.
 * @param  {Object}   options   Options containing the following information
 *                                name        Name of the middleware
 *                                description Human readable description of the middleware
 *                                app         The application this middleware is running in
 *                                logger      The logger used in an instance of this middleware class
 */
var Middleware = module.exports = function (fn, options) {

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
  params.name = params.name || this.name || '';
  params.description = params.description || this.description || '';
  params.fn = params.fn || this.fn || function () {};
  params.app = params.app || this.app;

  if (this.app.appName && this.app.appName.length > 0) {
    params[this.app.appName] = this[this.app.appName];
  }

  this.log.info('Middleware "' + this.name + '" starting...');
  this.fn.call(this.app, params, this.done(next).bind(this));
};

/**
 * Called when the middleware is finished
 * @param  {[type]}   err [description]
 * @return {Function}     [description]
 */
Middleware.prototype.done = function (next) {
  return function (err) {
    this.log.info('Middleware "' + this.name + '" finished.');
    next(err);
  };
};
