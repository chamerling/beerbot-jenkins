'use strict';

var jenkinsapi = require('jenkins-api');

module.exports = function(bot, options) {
  var q = bot.q;
  var logger = bot.logger;

  options = options || {
    endpoint: 'http://localhost:8080/jenkins'
  };

  var jenkins = jenkinsapi.init(options.endpoint);

  var actions = {
    status: function(parameters) {
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

  return {
    mention: function(message) {
      var split = message.text.split(' ');
      var action = split[2];
      if (!action) {
        return q.when('No action');
      }

      if (!actions[action]) {
        return q.when('Unknown action \'' + action + '\'');
      }

      return actions[action](split.splice(3));
    },
    receive: function(message) {
      return q.when('Jenkins!');
    }
  };
};
