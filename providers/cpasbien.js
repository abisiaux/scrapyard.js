var async   = require('async');
var magnet  = require('magnet-uri');
var util    = require('util');
var parseTorrent = require('parse-torrent');
var network = require('../network');

const request = require('request')
const cheerio = require('cheerio')
const Extractor = require('./extractor.js')

var CPASBIEN_URL = 'http://www.cpasbien.cm';

// ----------------------------------------------------------------------------

function parse(item, callback) {
	parseTorrent.remote(item.torrent, function (err, parsedTorrent) {
		if (err) {
			callback(err, null);
			
		} else {
			var magnetInfo = {
					title:  item.title,
					source: 'Cpasbien',
					link:   item.torrent,
					seeds:  item.seeds,
					peers:  item.leechs
			};
	
			var size = item.size;
			var split = size.split(" ");
			var value = split[0].split(".");
			if (split[1].startsWith("Ko")) {
				magnetInfo.size = value[0] * 1024 + value[1];
			} else if (split[1].startsWith("Mo")) {
				magnetInfo.size = value[0] * 1024 * 1024 + value[1] * 1024;
			} else if (split[1].startsWith("Go")) {
				magnetInfo.size = value[0] * 1024 * 1024 *1024 + value[1] * 1024 * 1024;
			}
	
			magnetInfo.link = magnet.encode({
				dn: magnetInfo.title,
				xt: [ 'urn:btih:' + parsedTorrent.infoHash ],
				tr: parsedTorrent.announce
			});
			callback(null, magnetInfo);
		}
	});
}

function search(query, type, lang, callback) {
	SearchCpasbien(query, type, lang).then((values) => {
		if (values === undefined || values.items.length == 0) {
			callback(null, []);
		}
		async.map(values.items, parse, 
				function(err, magnets) {
			callback(err, magnets);
		}
		);
	});
}

// ----------------------------------------------------------------------------

exports.movie = function(movieInfo, lang, callback) {
	
	console.log('Search movie [%s] on cpasbien with lang [%s]',movieInfo.title, lang);
	
	search(movieInfo.title, 'MOVIES', lang, callback);

//	async.parallel(
//			[
//			 function(callback) {
//				 search(movieInfo.title, 'MOVIES', lang, callback);
//			 }
//			 ],
//			 function(err, results) {
//				if (err) {
//					callback(err, null);
//				} else {
//					movieMagnets = [];
//					for (var i = 0; i < results.length; i++) {
//						if(results[i] != null) {
//							movieMagnets = mergeMagnetLists(movieMagnets, results[i]);
//						}
//					}
//					callback(null, movieMagnets);
//				}
//			}
//	);
}

// ----------------------------------------------------------------------------

exports.episode = function(showInfo, seasonIndex, episodeIndex, lang, callback) {
	
	
	 console.log('Search tv show [%s] season [%s] episode [%s] with lang [%s] on cpasbien', showInfo.title, season, episode, lang);
	 var season = seasonIndex.toString();
	 if (seasonIndex < 10) {
		 season = '0' + season;
	 }
	 var episode = episodeIndex.toString();
	 if (episodeIndex < 10) {
		 episode = '0' + episode;
	 }
	 search(util.format('%s-s%s-e%s', showInfo.title, season, episode), 'TVSHOWS', lang, callback);
	 
//	async.parallel(
//			[
//			 function(callback) {
//				 console.log('Search tv show episode on cpasbien');
//				 var season = seasonIndex.toString();
//				 if (seasonIndex < 10) {
//					 season = '0' + season;
//				 }
//				 var episode = episodeIndex.toString();
//				 if (episodeIndex < 10) {
//					 episode = '0' + episode;
//				 }
//				 search(util.format('%s-s%s-e%s', showInfo.title, season, episode), 'TVSHOWS', lang, callback);
//			 }
//			 ],
//			 function(err, results) {
//				if (err) {
//					callback(err, null);
//				} else {
//					episodeMagnets = [];
//					for (var i = 0; i < results.length; i++) {
//						episodeMagnets = mergeMagnetLists(episodeMagnets, results[i]);
//					}
//					callback(null, episodeMagnets);
//				}
//			}
//	);
}

// ----------------------------------------------------------------------------

function mergeMagnetLists(list1, list2) {
	var toAdd = [];

	if (list2) {
		for (var i = 0; i < list2.length; i++) {
			var alreadyAdded = false;

			for (var j = 0; j < list1.length; j++) {
				if (list2[i].link == list1[j].link) {
					alreadyAdded = true;
					break;
				}
			}

			if (!alreadyAdded) {
				toAdd.push(list2[i]);
			}
		}
	}

	return list1.concat(toAdd);
}

// -----------------------------------------------------------------------------

function _crawl (URI) {
    return new Promise((resolve, reject) => {
      request(URI, (err, res, html) => {
        if (err) reject(err)

        const $ = cheerio.load(html)
        const $items = $('#gauche').children('.ligne1, .ligne0')

        const items = []
        $items.each((sum, item) => {
          items.push(_createItemObject($(item)))
        })

        const pagination = _createPagination($('#pagination'))
        resolve({items, pagination})
      })
    })
}

function _createItemObject (item) {
    return {
      title: Extractor.getTitle(item),
      cover: Extractor.getCover(item),
      seeds: Extractor.getSeeds(item),
      leechs: Extractor.getLeechs(item),
      size: Extractor.getSize(item),
      torrent: Extractor.getTorrentURL(item)
    }
  }

function _createPagination (pagination) {
    return {
      next: pagination.find('a:last-child').attr('href')
    }
  }

// Type : MOVIES, TVSHOWS
// Lang : FR, VO, VOSTFR
function SearchCpasbien (query, type, lang) {
	console.log('Query : %s - %s - %s', query, type, lang);
	var URL = CPASBIEN_URL + '/recherche/';
	
	switch (type) {
	case 'MOVIES':
		switch (lang) {
		case 'FR':
			URL = URL + 'films-french';
			break;
		case 'VO':
			URL = URL + 'films';
			break;
		case 'VOSTFR':
			URL = URL + 'films-vostfr';
			break;
		default:
			URL = URL + 'films';
			break;
		}
		break;
	case 'TVSHOWS':
		switch (lang) {
		case 'FR':
			URL = URL + 'series-francaise';
			break;
		case 'VO':
			URL = URL + 'series';
			break;
		case 'VOSTFR':
			URL = URL + 'series-vostfr';
			break;
		default:
			break;
		}
		break;
	}
	
	URL = URL + '/' + encodeURI(query.toLowerCase()) + '.html';
		
	console.log(URL)
	
	return _crawl(URL);
}