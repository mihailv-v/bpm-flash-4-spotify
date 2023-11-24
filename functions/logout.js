
  exports.handler = async (event, context) => {
    res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.clearCookie('expires_in');
  res.clearCookie('last_logged_in');

  // Send a success response and trigger a page reload in the client
  res.status(200).send('You have been logged out. <script>window.location.reload();</script>');
  }
  