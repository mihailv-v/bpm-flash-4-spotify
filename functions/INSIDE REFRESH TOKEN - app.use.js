
  exports.handler = async (event, context) => {
    const refresh_token = req.cookies.refresh_token; // Retrieve your stored refresh token
        const newAccessToken = await refreshAccessToken(refresh_token);

        if (newAccessToken) {
            // Update the access token in your storage
            res.cookie('access_token', newAccessToken);
            req.cookies.access_token = newAccessToken; // Update the request object
            lastLoggedIn= Date.now()/1000;
            res.cookie('last_logged_in', lastLoggedIn);
            req.cookies.last_logged_in = lastLoggedIn; // Update the request object
        }
  }
  