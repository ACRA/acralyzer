angular.module('acra-storage', ['ngResource']).
    factory('ReportsStore', function($resource) {
      console.log("coucou acra-storage");
      var ReportsStore = $resource('/acra-storage/_design/acra-storage/_view/:view');

      ReportsStore.reportsPerDay = function(grouplvl, cb) {
        return ReportsStore.get({view: 'reports-per-day', group_level: grouplvl}, cb);
      };

      ReportsStore.recentReports = function(cb) {
        return ReportsStore.get({view: 'recent-items'}, cb);
      };
      return ReportsStore;
    });