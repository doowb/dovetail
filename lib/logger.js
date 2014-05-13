/**
 * Copyright (c) 2014 Brian Woodward, contributors.
 * Licensed under the MIT License (MIT).
 */


var defaultLog = function () {
  console.log.apply(null, [].slice.call(arguments));
};

var defaultLogger = module.exports = {
  debug   : defaultLog,
  info    : defaultLog,
  warning : defaultLog,
  error   : defaultLog,
  critical: defaultLog
};