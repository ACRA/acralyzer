/*
 Copyright 2013 Kevin Gaudin (kevin.gaudin@gmail.com)

 This file is part of Acralyzer.

 Acralyzer is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 Acralyzer is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with Acralyzer.  If not, see <http://www.gnu.org/licenses/>.
 */

angular.module('acra-storage', ['ngResource']).
    factory('ReportsStore', function($resource, $http) {
        var appName = acralyzerConfig.defaultApp;
        var dbName = acralyzerConfig.appDBPrefix + appName;
        var lastseq = 0;
        // ReportsStore service instance
        var ReportsStore = {};

        ReportsStore.setApp = function(newAppName) {
            appName = newAppName;
            ReportsStore.views = $resource('/' + dbName + '/_design/acra-storage/_view/:view');
            ReportsStore.details = $resource('/' + dbName + '/:reportid');
            ReportsStore.dbstate = $resource('/' + dbName + '/');
            ReportsStore.changes = $resource('/' + dbName + '/_changes');
        }
        ReportsStore.setApp(appName);

        ReportsStore.listApps = function(cb, errorHandler) {
            console.log("get _all_dbs");
            var filterDbsCallback = function(data) {
                console.log("_all_dbs retrieved");
                console.log(data);
                var finalData = [];
                for(var i in data) {
                    if(data[i].indexOf(acralyzerConfig.appDBPrefix) == 0) {
                        console.log("Found one acra storage: " + data[i]);
                        finalData.push(data[i].substring(acralyzerConfig.appDBPrefix.length));
                    }
                }
                cb(finalData);
            }
            $http.get('/_all_dbs').success(filterDbsCallback).error(errorHandler);
        }

        // Key: date/time Value: quantity
        ReportsStore.reportsPerDay = function(grouplvl, cb, errorHandler) {
            return ReportsStore.views.get({view: 'reports-per-day', group_level: grouplvl}, cb, errorHandler);
        };

        // 10 latest reports - Key: date/time Value: report digest
        ReportsStore.recentReports = function(cb, errorHandler) {
            return ReportsStore.views.get({view: 'recent-items', limit: 10, descending: true}, cb, errorHandler);
        };

        // Key: report ID Value: report digest
        ReportsStore.reportsList = function(startKey, reportsCount, includeDocs, cb, errorHandler) {
            var viewParams = {
                view: 'recent-items',
                descending: true,
                limit: reportsCount + 1,
                include_docs: includeDocs
            };
            if(startKey != null) {
                viewParams.startkey = '"' + startKey + '"';
            }

            var additionalCallback = function(data) {
                if(data.rows && (data.rows.length > reportsCount)) {
                    data.next_row = data.rows.splice(reportsCount,1)[0];
                }
                cb(data);
            };
            var result = ReportsStore.views.get(viewParams, additionalCallback, errorHandler);
            return result;
        };

        // Key: report ID Value: report digest
        ReportsStore.filteredReportsList = function(filterName, filterValue, pageStartKey, reportsCount, includeDocs, cb, errorHandler) {
            var viewParams = {
                view: 'recent-items-by-' + filterName,
                descending: true,
                limit: reportsCount + 1,
                include_docs: includeDocs,
                endkey: JSON.stringify([filterValue]),
                startkey: JSON.stringify([filterValue,{}]),
                reduce: false
            };
            if(pageStartKey != null) {
                viewParams.startkey = JSON.stringify(pageStartKey);
            }

            var additionalCallback = function(data) {
                if(data.rows && (data.rows.length > reportsCount)) {
                    data.next_row = data.rows.splice(reportsCount,1)[0];
                }
                cb(data);
            };
            var result = ReportsStore.views.get(viewParams, additionalCallback, errorHandler);
            return result;
        };

        // 1 full report
        ReportsStore.reportDetails = function(id, cb) {
            return ReportsStore.details.get({reportid: id}, cb);
        }

        ReportsStore.reportsPerFieldName = function(fieldName, cb, errorHandler) {
            return ReportsStore.views.get({view: 'reports-per-' + fieldName, group_level: 1}, cb, errorHandler);
        };

        ReportsStore.appVersionsList = function(cb) {
            return ReportsStore.views.get({view: 'recent-items-by-appver', group_level: 1}, cb);
        }

        ReportsStore.androidVersionsList = function(cb) {
            return ReportsStore.views.get({view: 'recent-items-by-androidver', group_level: 1}, cb);
        }

        ReportsStore.pollChanges = function(cb) {
            console.log("Polling changes since = " + lastseq);
            ReportsStore.changes.get(
                {feed:'longpoll', since: lastseq},
                function(data){
                    if(data.last_seq > lastseq) {
                        console.log("New changes");
                        cb();
                        lastseq = data.last_seq;
                    }
                    ReportsStore.pollChanges(cb);
                },
                function() {
                    console.log("Error wile polling changes");
                    ReportsStore.pollChanges(cb);
                }
            );
        }

        ReportsStore.startPolling = function(cb) {
            ReportsStore.dbstate.get(
                {},
                // Success
                function(data) {
                    lastseq = data.update_seq;
                    console.log("DB status retrieved, last_seq = " + lastseq);
                    ReportsStore.pollChanges(cb);
                },
                // Error
                function() {
                console.log("Polling failed");
            });
        }

        return ReportsStore;
    });