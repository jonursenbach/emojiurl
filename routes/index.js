module.exports = function (app) {
  var fs = require('fs');

  var levelup = require('levelup');
  var db = levelup('./db');

  var lexicon = require('emoji-lexicon');
  var Handlebars = require('handlebars');
  var validator = require('validator');

  app.get('/', function (req, res, next) {
    res.render('index');
  });

  app.get('/shorten', function (req, res, next) {
    if (typeof req.query.url === 'undefined') {
      res.send(400, {
        error: 'Sorry, a URL was not supplied.'
      });

      return;
    }

    var url = req.query.url;
    if (!validator.isURL(url)) {
      res.send(400, {
        error: 'Sorry, an invalid URL was supplied.'
      });

      return;
    } else if (!validator.isURL(url, {require_protocol: true})) {
      url = 'http://' + url;
    }

    try {
      var shortened = '';
      for (var x=0; x<4; x++) {
        shortened += lexicon[Math.floor(Math.random() * lexicon.length)];
      }

      db.put(shortened, url, function (err) {
        if (err) {
          return next(err);
        }

        res.send(200, {
          url: 'http://' + req.headers.host + '/' + shortened
        });
      });
    } catch (err) {
      return next(err);
    }
  });

  app.get(/\/(.*)/i, function (req, res, next) {
    db.get(decodeURIComponent(req.params[0]), function (err, value) {
      if (err) {
        if (err.notFound) {
          res.send(404, 'Not found.');
          res.end();
          return;
        }

        return next(err);
      }

      console.log(value);

      res.redirect(value);
    });
  });
};
