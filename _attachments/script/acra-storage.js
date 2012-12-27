angular.module('acra-storage', ['ngResource']).
    factory('ReportsStore', function($resource) {
        var ReportsStore = {
            views: $resource('/acra-storage/_design/acra-storage/_view/:view'),
            details: $resource('/acra-storage/:reportid')
        };

        ReportsStore.reportsPerDay = function(grouplvl, cb, errorHandler) {
            return ReportsStore.views.get({view: 'reports-per-day', group_level: grouplvl}, cb, errorHandler);
        };

        ReportsStore.recentReports = function(cb, errorHandler) {
            return ReportsStore.views.get({view: 'recent-items', limit: 10, descending: true}, cb, errorHandler);
        };

        ReportsStore.reportDetails = function(id, cb) {
            return ReportsStore.details.get({reportid: id}, cb);
        }

        ReportsStore.reportsPerFieldName = function(fieldName, cb, errorHandler) {
            return ReportsStore.views.get({view: 'reports-per-' + fieldName, group_level: 1}, cb, errorHandler);
        };

        return ReportsStore;
    });