exports.get404 = (req, res, next) => {
  csrfToken = req.csrfToken();
  res.status(404).render('404', { pageTitle: 'Page Not Found', path: '/404',
  isAuthenticated: req.session.isLoggedIn, csrfToken: csrfToken, cartLength: '' });
};

exports.get500 = (req, res, next) => {
  csrfToken = req.csrfToken();
  res.status(500).render('500', { pageTitle: 'Error Occurred', path: '/500',
  isAuthenticated: req.session.isLoggedIn, csrfToken: csrfToken, cartLength: '' });
};
