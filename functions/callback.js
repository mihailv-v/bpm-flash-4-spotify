
  exports.handler = async (event, context) => {
    const code = req.query.code || null;
    const state = req.query.state || null;

    if (state === null) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(clientId + ':' + clientSecret).toString('base64'))
            },
            json: true
        };

        try {
            const response = await fetch(authOptions.url, {
                method: 'POST',
                body: querystring.stringify(authOptions.form),
                headers: {
                    'Authorization': authOptions.headers.Authorization,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.status === 200) {
                const data = await response.json();
                lastLoggedIn= Date.now()/1000;
                // Now you have the access token and can use it for your API requests
                const access_token = data.access_token;
                // You should also get and store the refresh token here
                const refresh_token = data.refresh_token;
                const expires_in = data.expires_in;
              console.log(`in /callback: expiration `, formatTimestamp(expires_in))
              tokenIsAboutToExpire(expires_in, lastLoggedIn)
                console.log('Access token obtained successfully');
                console.log('Access token:', access_token);
                console.log('Refresh token:', refresh_token);
                console.log('Expires in:', expires_in);

                // Set the access token, refresh token, and expiration time in cookies
                res.cookie('access_token', access_token);
                res.cookie('refresh_token', refresh_token);
                res.cookie('expires_in', expires_in);
                res.cookie('last_logged_in', lastLoggedIn);

                // Redirect to your desired page after authentication
                res.redirect('/');
            } else {
                console.error('Error fetching access token:', response.statusText);
                res.send('Error occurred during authentication.');
            }
        } catch (error) {
            console.error('Error fetching access token:', error);
            res.send('Error occurred during authentication.');
        }
    }
  }
  