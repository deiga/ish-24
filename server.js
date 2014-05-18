var express = require('express');
var http = require('http');
var logger = require('morgan');

require('./lib/ish-24');

var app = express();

app.use(logger('short'));

var port = Number(process.env.PORT || 8080);
http.createServer(app).listen(port);
console.log('Running at port: ' + port);

module.exports = app;
