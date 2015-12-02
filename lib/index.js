'use strict';

var jenkinsapi = require('jenkins-api');
var PATTERN = /!jenkins (.*)/i;

module.exports = function(bot, options) {

  var q = bot.q;
  var logger = bot.logger;

  options = options || {
    endpoint: 'http://localhost:8080/jenkins'
  };

  var jenkins = jenkinsapi.init(options.endpoint);

  var actions = {
    status: function() {
      var defer = q.defer();
      jenkins.queue(function(err, data) {
        if (err) {
          logger.error(err);
          return defer.reject(err);
        }

        if (!data.items.length) {
          return defer.resolve('Queue is empty');
        }

        defer.resolve(JSON.stringify(data.items));
      });
      return defer.promise;
    },
    job: function(parameters) {
      var defer = q.defer();
      logger.debug('Job info with parameters', parameters);
      jenkins.job_info(parameters[0], function(err, data) {
        if (err) {
          logger.error(err);
          return defer.reject(err);
        }
        defer.resolve(data);
      });
      return defer.promise;
    }
  };

  bot.listen(PATTERN, options, function(response) {
    var parameters = response.match[1];
    var array = parameters.split(' ');
    var action = array[0];

    if (!actions[action]) {
      return response.send('Unknown action \'' + action + '\'');
    }

    actions[action](array.splice(1)).then(function(result) {
      response.send(result);
    }, function(err) {
      logger.error('Error while getting jenins data', err);
    });
  });
};
