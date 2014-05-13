/**
 * return true if a direct match or a wildcard match
 * @param   {[type]}   a  [description]
 * @param   {[type]}   b  [description]
 * @return  {Boolean}     [description]
 */

exports.isEventMatch = function (a, b) {
  return (a === b) || a === '*';
};
