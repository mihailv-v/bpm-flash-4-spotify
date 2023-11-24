
  exports.handler = async (event, context) => {
    console.log('Not a Spotify link from shortLink', currentURL);
        return res.status(400).json({ error: 'Not a valid Spotify link' });
  }
  