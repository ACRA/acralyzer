angular.module('acra-storage', ['ngResource']).
    factory('ReportsStore', function($resource) {
      var ReportsStore = {
        views: $resource('/acra-storage/_design/acra-storage/_view/:view'),
        details: $resource('/acra-storage/:reportid')
      };

      ReportsStore.reportsPerDay = function(grouplvl, cb) {
        return ReportsStore.views.get({view: 'reports-per-day', group_level: grouplvl}, cb);
      };

      ReportsStore.recentReports = function(cb) {
        return ReportsStore.views.get({view: 'recent-items', limit: 10, descending: true}, cb);
      };

      ReportsStore.reportDetails = function(id, cb) {
        return ReportsStore.details.get({reportid: id}, cb);
      }
      return ReportsStore;
    });