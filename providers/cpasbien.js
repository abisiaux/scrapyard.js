var async   = require('async');
var magnet  = require('magnet-uri');
var util    = require('util');
var parseTorrent = require('parse-torrent');

var network = require('../network');

const CPBAPI = require('cpasbien-api')
const api = new CPBAPI()

exports.movie = function(movieInfo, callback) {
	api.Search(movieInfo.title).then((values) => {
		var magnets = [];
		var nb = 0;
		
		if (values === undefined || values.items.length == 0) {
			callback(null, magnets);
		}
		
		for (var i = 0; i < values.items.length; i++) {

			var magnetInfo = {
				title:  values.items[i].title,
				source: 'Cpasbien',
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

			parseTorrent.remote(values.items[i].torrent, function (err, parsedTorrent) {
				nb = nb + 1;
				if (err)  {
					console.log(err);
				} else {
					console.log("Torrent OK : " + parsedTorrent.infoHash);
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
	
					magnets.push(magnetInfo);
				}
				
				if (nb == values.items.length) {
					console.log("Send callback");
					callback(null, magnets);
				}		
			});
		}
	});
}



exports.episode = function(showInfo, seasonIndex, episodeIndex, callback) {
	 var magnets = [];
	 callback(null, magnets);
}