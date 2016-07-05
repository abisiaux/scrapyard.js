var async   = require('async');
var magnet  = require('magnet-uri');
var util    = require('util');

var network = require('../network');

var CPBAPI = require('cpasbien-api')
var api = new CPBAPI()


// ----------------------------------------------------------------------------

exports.movie = function(movieInfo, callback) {
	api.Search(movieInfo.title, {scope: 'movies'})
	  .then(function(err, data) {
		  for (var i = 0; i < data.items.length; i++) {
			  var magnetInfo = {
			          title:  data.list[i].title,
			          source: 'Cpasbien.io',
			          size:   data.list[i].size,
			          seeds:  data.list[i].seeds,
			          peers:  data.list[i].leechs
			        };
			  magnetInfo.link = magnet.encode({
		          dn: magnetInfo.title,
		          xt: [ 'urn:btih:' + data.list[i].torrent ],
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
		  
		  callback(null, magnets);
	  });
}

// ----------------------------------------------------------------------------

exports.episode = function(showInfo, seasonIndex, episodeIndex, callback) {
	callback(null, magnets);
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
