
  exports.handler = async (event, context) => {
    const state = generateRandomString(16);
    const showDialog = true;

    const spotifyAuthUrl = 'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: clientId,
            scope: scope,
            redirect_uri: redirectUri,
            state: state,
            show_dialog: isReplit ? false : true
        });

    console.log('Redirecting to Spotify login:', spotifyAuthUrl);

    res.redirect(spotifyAuthUrl);
    lastLoggedIn = Date.now() / 1000;
  }
  