var express = require("express");
var app = express();
var crawler = require("./lib/crawler");

app.get("/crawl", async (req, res) => {
  console.log("Query params :: ", JSON.stringify(req.query));
  const { url, depth } = req.query;
  crawler
    .crawlTillDepth(url, depth)
    .then((resp) => {
      res.send(resp);
      return Promise.resolve({});
    })
    .catch((err) => {
      return Promise.reject(err);
    });
});

module.exports = app;
