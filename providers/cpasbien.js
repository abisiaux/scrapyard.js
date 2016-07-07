var async   = require('async');
var asyncForEach   = require('async-foreach');
var magnet  = require('magnet-uri');
var util    = require('util');
var parseTorrent = require('parse-torrent');

var network = require('../network');

//----------------------------------------------------------------------------

const CPBAPI = require('cpasbien-api')
const api = new CPBAPI()

//----------------------------------------------------------------------------

function parse(item, callback) {
	console.log("Parse item : ", item);
	parseTorrent.remote(item.torrent, function (err, parsedTorrent) {
		if (err) {
			callback(err, null)
		}
		if (parsedTorrent.dn) {

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
				tr: [
				     'udp://tracker.internetwarriors.net:1337',
				     'udp://tracker.coppersurfer.tk:6969',
				     'udp://open.demonii.com:1337',
				     'udp://tracker.leechers-paradise.org:6969',
				     'udp://tracker.openbittorrent.com:80'
				     ]
			});
			callback(null, magnetInfo);
		}
		callback(null, null)
	});
}

function search(query, options, callback) {
	api.Search(query, options).then((values) => {

		console.log('Query : %s', query);

		if (values === undefined || values.items.length == 0) {
			callback(null, []);
		}
		async.map(values.items, parse, 
				function(err, magnets) {
			console.log('Results : ');
			console.log(magnets);
			callback(err, magnets);
		}
		);
	});
}

//----------------------------------------------------------------------------

exports.movie = function(movieInfo, callback) {

	async.parallel(
			[
			 function(callback) {
				 search(movieInfo.title, {scope: 'movies'}, callback);
			 }
			 ],
			 function(err, results) {
				console.log('Results after : ');
				console.log(results);
				if (err) {
					callback(err, null);
				} else {
					movieMagnets = [];
					for (var i = 0; i < results.length; i++) {
						movieMagnets = mergeMagnetLists(movieMagnets, results[i]);
					}
					callback(null, movieMagnets);
				}
			}
	);
}

//----------------------------------------------------------------------------

exports.episode = function(showInfo, seasonIndex, episodeIndex, callback) {
	async.parallel(
			[
			 function(callback) {
				 console.log('Search tv show episode on cpasbien');
				 var season = seasonIndex.toString();
				 if (seasonIndex < 10) {
					 season = '0' + season;
				 }
				 var episode = episodeIndex.toString();
				 if (episodeIndex < 10) {
					 episode = '0' + episode;
				 }
				 search(util.format('%s-s%s-e%s', showInfo.title, season, episode), {scope: 'tvshow'}, callback);
			 }
			 ],
			 function(err, results) {
				if (err) {
					callback(err, null);
				} else {
					episodeMagnets = [];
					for (var i = 0; i < results.length; i++) {
						episodeMagnets = mergeMagnetLists(episodeMagnets, results[i]);
					}
					callback(null, episodeMagnets);
				}
			}
	);
}

//----------------------------------------------------------------------------

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