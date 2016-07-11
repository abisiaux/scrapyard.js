var async = require('async');
var magnet = require('magnet-uri');
var util = require('util');

var network = require('../network');

// ----------------------------------------------------------------------------

var KICKASS_URL = 'https://kat.cr'

// ----------------------------------------------------------------------------

function search(category, lang, query, callback) {
	var magnets = [];

	var langCode
	switch (lang) {
	case 'FR':
		langCode = 5;
		break;
	case 'VO':
		langCode = 2;
		break;
	case 'VOSTFR':
		langCode = 2;
		query = query + ' VOSTFR ';
		break;
	default:
		langCode = 2;
		break;
	}

	var url = KICKASS_URL + '/json.php';
	var param = {
		q : 'category:' + category + ' lang_id:' + langCode + ' ' + query,
		field : 'seeders',
		order : 'desc'
	};

	console.log('Search on kickass : %s with : %s', url, JSON.stringify(param));

	network.json(url, param, null, function(err, data) {
		if (err) {
			callback(null, magnets);
		} else {
			for (var i = 0; i < data.list.length; i++) {
				var magnetInfo = {
					title : data.list[i].title,
					source : 'KickassTorrents',
					size : data.list[i].size,
					seeds : data.list[i].seeds,
					peers : data.list[i].leechs
				};

				magnetInfo.link = magnet.encode({
					dn : magnetInfo.title,
					xt : [ 'urn:btih:' + data.list[i].hash ],
					tr : [ 'udp://tracker.internetwarriors.net:1337',
							'udp://tracker.coppersurfer.tk:6969',
							'udp://open.demonii.com:1337',
							'udp://tracker.leechers-paradise.org:6969',
							'udp://tracker.openbittorrent.com:80' ]
				});

				magnets.push(magnetInfo);
			}
			callback(null, magnets);
		}
	});
}

// ----------------------------------------------------------------------------

exports.movie = function(movieInfo, lang, callback) {
	console.log('Search movie on Kickass : %s %s', movieInfo.title, lang);
	search('movies', lang, 'imdb:'
			+ ((movieInfo.imdb_id != null) ? movieInfo.imdb_id.substring(2)
					: ''), function(err, movieMagnets) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, movieMagnets);
		}
	});
}

// ----------------------------------------------------------------------------

exports.episode = function(showInfo, seasonIndex, episodeIndex, lang, callback) {
	console.log('Search serie on Kickass : %s %s %s %s', showInfo.title,
			seasonIndex, episodeIndex, lang);
	async.parallel([ function(callback) {
		search('tv', lang, util.format(' %s season:%s episode:%s ',
				showInfo.title, seasonIndex, episodeIndex), callback);
	} ], function(err, results) {
		if (err) {
			callback(err, null);
		} else {
			episodeMagnets = [];
			for (var i = 0; i < results.length; i++) {
				episodeMagnets = mergeMagnetLists(episodeMagnets, results[i]);
			}
			callback(null, episodeMagnets);
		}
	});
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