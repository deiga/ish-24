'use strict';

var xmlrpc = require('xmlrpc');
var _ = require('lodash');
var redis = require("redis");
var Trello = require('trello');
var moment = require('moment');

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

var trello = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);

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
      last_fetch_time = moment().format('YYYY-MM-DD HH:mm:ss');
    }
    redisClient.set("LAST_FETCH_TIME", moment().format('YYYY-MM-DD HH:mm:ss'));
    client.methodCall('Bug.search', [{creation_time: last_fetch_time}], function(err, res) {
      if (err) {throw err;}
      console.log("Bug count: " + res.bugs.length);
      _.forEach(res.bugs, function(bug) {
        trello.addCard(bug.summary, null, process.env.LIST_ID, function(err, card) {
          if (err) {
            console.error('Could not add card', err);
          } else {
            console.log('Added card:', card.name);
          }
        });
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

