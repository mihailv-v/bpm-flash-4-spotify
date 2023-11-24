
  exports.handler = async (event, context) => {
    res.sendFile(path.join(__dirname, '/pb/index.html'));
  }
  