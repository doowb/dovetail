/**
 * Copyright (c) 2014 Brian Woodward, contributors.
 * Licensed under the MIT License (MIT).
 */

var _ = require('lodash');

var Events = function () {
  if (!(this instanceof Events)) {
    return new Events();
  }

  this.cache = {};

  this.add = function (name, value) {
    var events = {};
    if (_.isObject(name)) {
      events = name;
    } else {
      events[name] = value;
    }

    _.map(_.keys(events), function (key) {
      this.cache[key] = events[key];
    }.bind(this));
  };

  this.remove = function (key) {
    if (this.cache[key]) {
      delete this.cache[key];
    }
  };

  this.all = function () {
    return this.cache;
  };
};

module.exports = new Events();

