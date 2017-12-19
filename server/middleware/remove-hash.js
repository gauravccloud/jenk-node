var hashRemoval = function(req, res, next) {
  const hasHashInName = /[a-f0-9]{64}\./;
  req.url = req.url.replace(hasHashInName, '');
  next();
};
module.exports = hashRemoval;