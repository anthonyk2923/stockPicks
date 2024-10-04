console.clear();

const express = require('express');
const path = require('path');
const fs = require('fs');

require('colors');

const app = express();

const PORT = 4848;

app.use(express.static(path.join(__dirname)));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.listen(PORT, () => {
  console.log(`App Listening on Port ${PORT}`.grey);
});
