/**
 * Assemble
 *
 * Assemble <http://assemble.io>
 * Created and maintained by Jon Schlinkert and Brian Woodward
 *
 * Copyright (c) 2014 Upstage.
 * Licensed under the MIT License (MIT).
 */


var defaultLog = function () {
  console.log.apply(null, [].slice.call(arguments));
};

var defaultLogger = module.exports = {
  debug : defaultLog,
  info : defaultLog,
  warning : defaultLog,
  error : defaultLog,
  critical : defaultLog
};
