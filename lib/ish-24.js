'use strict';

var xmlrpc = require('xmlrpc');
var _ = require('lodash');
var redis = require("redis");

/*
 * ish-24
 * https://github.com/deiga/ish-24
 *
 * Copyright (c) 2014 Timo Sand
 * Licensed under the MIT license.
 */


/**
 * Following the 'Node.js require(s) best practices' by
 * http://www.mircozeiss.com/node-js-require-s-best-practices/
 *
 * // Nodejs libs
 * var fs = require('fs'),
 *
 * // External libs
 * debug = require('debug'),
 *
 * // Internal libs
 * data = require('./data.js');
 */
var redisClient = redis.createClient();

var clientOptions = {
  url: process.env.URL,
  cookies: true
};

var client = xmlrpc.createClient(clientOptions);

redisClient.on('error', function(err) {
  console.err("Redis error " + err);
});

function searchBugs() {
  console.log("Searching for new bugs");
  var last_fetch_time;
  redisClient.get("LAST_FETCH_TIME", function(err, reply) {
    console.log("LAST_FETCH_TIME: " + reply);
    if(reply) {
      last_fetch_time = reply;
    } else {
      last_fetch_time = new Date().toISOString();
    }
    redisClient.set("LAST_FETCH_TIME", new Date().toISOString());
    client.methodCall('Bug.search', [{creation_time: last_fetch_time}], function(err, res) {
      if (err) {throw err;}
      console.log("Bug count: " + res.bugs.length);
      _.forEach(res.bugs, function(bug) {
        console.log("Summary: " + bug.summary);
      });
    });
  });
}
client.methodCall('User.login', [{login: process.env.USERNAME, password: process.env.PASSWD}], function(err, res) {
  if(err) { throw err; }
  console.log("Logged in user: " + res.id);
  setImmediate(searchBugs);
  setInterval(searchBugs, 300000);
});

