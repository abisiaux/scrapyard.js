require('newrelic');

// ----------------------------------------------------------------------------

var app        = require('express')();
var bodyParser = require('body-parser');
var movies     = require('./movies');
var shows      = require('./shows');

// ----------------------------------------------------------------------------

var VERSION = '0.0.1';

// ----------------------------------------------------------------------------

app.set('json spaces', 2);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var server = app.listen(process.env.PORT || 5000, process.env.IP || '0.0.0.0', function() {
  console.log('[scrapyard] Starting on %s:%s', server.address().address, server.address().port);
});

// ----------------------------------------------------------------------------

app.get('/', function(req, res) {
  res.json({ version: VERSION });
});

// ----------------------------------------------------------------------------

app.get('/api/movies/trending', function(req, res) {
  movies.getTrending(parseInt(req.query.page, 10) || 1, 31, function(err, movieList) {
    if (err) {
      res.sendStatus(err['statusCode']);
    } else {
      movies.getInfos(movieList, function(err, movieInfos) {
        if (err) {
          res.sendStatus(err['statusCode']);
        } else {
          res.json({ movies: movieInfos });
        }
      });
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/movies/popular', function(req, res) {
  movies.getPopular(parseInt(req.query.page, 10) || 1, 31, function(err, movieList) {
    if (err) {
      res.sendStatus(err['statusCode']);
    } else {
      movies.getInfos(movieList, function(err, movieInfos) {
        if (err) {
          res.sendStatus(err['statusCode']);
        } else {
          res.json({ movies: movieInfos });
        }
      });
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/movies/search', function(req, res) {
  movies.search(req.query.query || '', function(err, movieList) {
    if (err) {
      res.sendStatus(err['statusCode']);
    } else {
      movies.getInfos(movieList, function(err, movieInfos) {
        if (err) {
          res.sendStatus(err['statusCode']);
        } else {
          res.json({ movies: movieInfos });
        }
      });
    }
  });
});

// ----------------------------------------------------------------------------

app.post('/api/movies/watchlist', function(req, res) {
  movies.getInfos(JSON.parse(req.body.movies_watchlist) || [], function(err, movieInfos) {
    if (err) {
      res.sendStatus(err['statusCode']);
    } else {
      res.json({ movies: movieInfos });
    }
  });
});

// ----------------------------------------------------------------------------

moviesCache = {};

app.get('/api/movie/:trakt_slug', function(req, res) {
  if (req.params.trakt_slug in moviesCache) {
    res.json(moviesCache[req.params.trakt_slug]);
  } else {
    movies.getInfo(req.params.trakt_slug, function(err, movieInfo) {
      if (err) {
        res.sendStatus(err['statusCode']);
      } else {
        moviesCache[req.params.trakt_slug] = movieInfo;
        res.json(movieInfo);
      }
    });
  }
});

// ----------------------------------------------------------------------------

app.get('/api/shows/trending', function(req, res) {
  shows.getTrending(parseInt(req.query.page, 10) || 1, 31, function(err, showList) {
    if (err) {
      res.sendStatus(err['statusCode']);
    } else {
      shows.getInfos(showList, function(err, showInfos) {
        if (err) {
          res.sendStatus(err['statusCode']);
        } else {
          res.json({ shows: showInfos });
        }
      });
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/shows/popular', function(req, res) {
  shows.getPopular(parseInt(req.query.page, 10) || 1, 31, function(err, showList) {
    if (err) {
      res.sendStatus(err['statusCode']);
    } else {
      shows.getInfos(showList, function(err, showInfos) {
        if (err) {
          res.sendStatus(err['statusCode']);
        } else {
          res.json({ shows: showInfos });
        }
      });
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/shows/search', function(req, res) {
  shows.search(req.query.query || '', function(err, showList) {
    if (err) {
      res.sendStatus(err['statusCode']);
    } else {
      shows.getInfos(showList, function(err, showInfos) {
        if (err) {
          res.sendStatus(err['statusCode']);
        } else {
          res.json({ shows: showInfos });
        }
      });
    }
  });
});

// ----------------------------------------------------------------------------

app.post('/api/shows/favorites', function(req, res) {
  shows.getInfos(JSON.parse(req.body.shows_favorites) || [], function(err, showInfos) {
    if (err) {
      res.sendStatus(err['statusCode']);
    } else {
      res.json({ shows: showInfos });
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/show/:trakt_slug', function(req, res) {
  shows.getInfo(req.params.trakt_slug, function(err, showInfo) {
    if (err) {
      res.sendStatus(err['statusCode']);
    } else {
      res.json(showInfo);
    }
  });
});
