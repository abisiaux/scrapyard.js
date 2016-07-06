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
		
		console.log(values);
		
		var magnets = [];

		if (values === undefined || values.items.length == 0) {
			callback(null, magnets);
		}

		for (var i = 0; i < values.items.length; i++) {

			var magnetLink       = values.items[i].torrent;
			var parsedMagnetLink = parseTorrent(magnetLink);

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
	search(movieInfo.title, {scope: 'movies'}, callback);
}

//----------------------------------------------------------------------------

exports.episode = function(showInfo, seasonIndex, episodeIndex, callback) {
	search(util.format('%s-s%s-e%s', showInfo.title, season, episode), {scope: 'tvshow'}, callback);
}