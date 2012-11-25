angular.module('acra-storage', ['ngResource']).
    factory('ReportsStore', function($resource) {
      var ReportsStore = $resource('/acra-storage/_design/acra-storage/_view/:view');

      ReportsStore.reportsPerDay = function(grouplvl, cb) {
        return ReportsStore.get({view: 'reports-per-day', group_level: grouplvl}, cb);
      };

      ReportsStore.recentReports = function(cb) {
        return ReportsStore.get({view: 'recent-items', limit: 10, descending: true}, cb);
      };
      return ReportsStore;
    });