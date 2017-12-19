var HTTPSRedirect = function(req, res, next)  {
  if (req.hostname === 'localhost') {
    return next();
  }

  if (typeof req.headers['x-forwarded-proto'] === 'undefined') {
    return next();
  }

  if (req.headers['x-forwarded-proto'].toLowerCase() === 'http') {
    res.redirect(`https://${req.hostname}${req.url}`);
    return;
  }
  next();
};

console.log('[Middleware: HTTPS Redirect] initialized.');
module.exports = HTTPSRedirect;