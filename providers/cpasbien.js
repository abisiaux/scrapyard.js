var async   = require('async');
var magnet  = require('magnet-uri');
var util    = require('util');
var parseTorrent = require('parse-torrent');

var network = require('../network');

//----------------------------------------------------------------------------

const CPBAPI = require('cpasbien-api')
const api = new CPBAPI()

//----------------------------------------------------------------------------

function search(query, options, callback) {
	api.Search(query, options).then((values) => {

		var magnets = [];

		if (values === undefined || values.items.length == 0) {
			callback(null, magnets);
		}

		async.forEach(values.items, 
				function(item, callback) {

			parseTorrent.remote(values.items[i].torrent, function (err, parsedTorrent, callback) {
				 if (err) {
					 callback(err,magnets)
				 }
				 console.log(parsedTorrent)
			 });
		}, 
		function(err) {
			// sort items by date
			items.sort(function(a, b) {
				return (Date.parse(b.date) - Date.parse(a.name));
			});
			var rssFeed = createAggregatedFeed();
			callback(err, rssFeed);
		}
		);


		console.log(parsedMagnetLink);

		if (parsedMagnetLink.dn) {
			if (!magnets.find(function(element, index, array) { return parseTorrent(element.link).infoHash == parsedMagnetLink.infoHash; })) {

				var magnetInfo = {
						title:  values.items[i].title,
						source: 'Cpasbien',
						link:   magnetLink,
						seeds:  values.items[i].seeds,
						peers:  values.items[i].leechs
				};

				var size = values.items[i].size;
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
					xt: [ 'urn:btih:' + parsedMagnetLink.infoHash ],
					tr: [
					     'udp://tracker.internetwarriors.net:1337',
					     'udp://tracker.coppersurfer.tk:6969',
					     'udp://open.demonii.com:1337',
					     'udp://tracker.leechers-paradise.org:6969',
					     'udp://tracker.openbittorrent.com:80'
					     ]
				});

				magnets.push(magnetInfo);
			}
		}
	}

	callback(null, magnets);
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

exports.episode = function(showInfo, seasonIndex, episodeIndex, callback) {
	async.parallel(
			[
			 function(callback) {
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