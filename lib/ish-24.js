'use strict';

var xmlrpc = require('xmlrpc');
var _ = require('lodash');
var redis = require("redis-url").connect(process.env.REDISCLOUD_URL);
var Trello = require('trello');
var moment = require('moment');
var after = require('after');

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

var trello = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);

var clientOptions = {
  url: process.env.URL,
  cookies: true
};

var client = xmlrpc.createClient(clientOptions);

redis.on('error', function(err) {
  console.error("Redis error " + err);
});

function createTrelloCard(bug_summary, err, bug_description) {
  if (err) {
    throw err;
  }
  trello.addCard(bug_summary, bug_description, process.env.LIST_ID, function(err, card) {
    if (err) {
      console.error('Could not add card', err);
    } else {
      console.log('Added card:', card.name);
    }
  });
}

function getBugComments(bug_id, bug_summary) {
  var trello_description = "";
  client.methodCall('Bug.comments', [{ids: [bug_id]}], function(err, res) {
    if (err) {
      throw err;
    }
    var next = after(res.bugs[bug_id].comments.length, createTrelloCard.bind(null, bug_summary));
    _.forEach(res.bugs[bug_id].comments, function(comment) {
      trello_description += comment.text;
      next(null, trello_description);
    });
  });
}

function searchBugs() {
  console.log("Searching for new bugs");
  var last_fetch_time;
  redis.get("LAST_FETCH_TIME", function(err, reply) {
    console.log("LAST_FETCH_TIME: " + reply);
    if (reply) {
      last_fetch_time = reply;
    } else {
      last_fetch_time = moment().format('YYYY-MM-DD HH:mm:ss');
    }
    redis.set("LAST_FETCH_TIME", moment().format('YYYY-MM-DD HH:mm:ss'));
    client.methodCall('Bug.search', [{creation_time: moment().subtract('hours', 2).format('YYYY-MM-DD HH:mm:ss')}], function(err, res) {
      if (err) {throw err;}
      console.log("Bug count: " + res.bugs.length);
      _.forEach(res.bugs, function(bug) {
        console.log(bug);
        if (!bug.is_open) {
          return;
        }
        getBugComments(bug.id, bug.summary);
      });
    });
  });
}
client.methodCall('User.login', [{login: process.env.USERNAME, password: process.env.PASSWD}], function(err, res) {
  if (err) { throw err; }
  console.log("Logged in user: " + res.id);
  setImmediate(searchBugs);
  setInterval(searchBugs, 300000);
});
