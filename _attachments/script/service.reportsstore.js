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
(function(acralyzerConfig,angular,acralyzerEvents,acralyzer) {
    "use strict";

    /**
     * Reports storage access module.
     *
     * @class ReportsStore
     * @singleton
     * @static
     */
    acralyzer.factory('ReportsStore', function($rootScope, $http, $resource) {
        // ReportsStore service instance
        var ReportsStore = {
            lastseq : -1,
            continuePolling : true,
            dbName : "",
            pollCounter : 0
        };

        /**
        * Switch to another app, i.e. reports storage database.
        * @param {String} newAppName The app name. The database name is determined by adding prefix set in
        * acralyzerConfig.appDBPrefix
        * @param {function} cb Callback to be executed after database changed.
        */
        ReportsStore.setApp = function (newAppName, cb) {
            ReportsStore.dbName = acralyzerConfig.appDBPrefix + newAppName;
            ReportsStore.views = $resource('/' + ReportsStore.dbName + '/_design/acra-storage/_view/:view');
            ReportsStore.details = $resource('/' + ReportsStore.dbName + '/:reportid');
            ReportsStore.dbstate = $resource('/' + ReportsStore.dbName + '/');
            ReportsStore.changes = $resource('/' + ReportsStore.dbName + '/_changes');
            ReportsStore.lastseq = -1;
            cb();
        };

        /**
        * Gets the list of available apps for which we have crash reports databases.
        * Looks for all CouchDB databases starting with
        * @param {function} cb Callback which will receive an array of strings (app names) as a parameter.
        * @param {function} [errorHandler] Callback to be triggered if an error occurs.
        */
        ReportsStore.listApps = function(cb, errorHandler) {
            console.log("get _all_dbs");
            var filterDbsCallback = function(data) {
                console.log("_all_dbs retrieved");
                console.log(data);
                var finalData = [];
                for (var i in data) {
                    if(data[i].indexOf(acralyzerConfig.appDBPrefix) === 0) {
                        console.log("Found one acra storage: " + data[i]);
                        finalData.push(data[i].substring(acralyzerConfig.appDBPrefix.length));
                    }
                }
                cb(finalData);
            };
            $http.get('/_all_dbs').success(filterDbsCallback).error(errorHandler);
        };

        /**
        * Gets the number of reports per unit of time.
        * @param {Number} grouplvl Grouping level: Year = 1, Month = 2, Day = 3, Hour = 4, Minute = 5, Second = 6.
        * @param {function} [cb] Callback which receives the results.
        * @param {function} [errorHandler] Called in case of error while retrieving data
        * @return Key: date/time, Value: quantity
        */
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
            if(startKey !== null) {
                viewParams.startkey = '"' + startKey + '"';
            }

            var additionalCallback = function(data) {
                if(data.rows && (data.rows.length > reportsCount)) {
                    data.next_row = data.rows.splice(reportsCount,1)[0];
                }
                cb(data);
            };
            return ReportsStore.views.get(viewParams, additionalCallback, errorHandler);
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
            if(pageStartKey !== null) {
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
        };

        ReportsStore.reportsPerFieldName = function(fieldName, cb, errorHandler) {
            return ReportsStore.views.get({view: 'reports-per-' + fieldName, group_level: 1}, cb, errorHandler);
        };

        ReportsStore.appVersionsList = function(cb) {
            return ReportsStore.views.get({view: 'recent-items-by-appver', group_level: 1}, cb);
        };

        ReportsStore.androidVersionsList = function(cb) {
            return ReportsStore.views.get({view: 'recent-items-by-androidver', group_level: 1}, cb);
        };

        ReportsStore.pollChanges = function(cb, pollCount) {
            console.log("Polling changes since = " + ReportsStore.lastseq + " (poller " + pollCount + ")");
            // Store the current dbName on polling start
            var currentlyPolledDB = ReportsStore.dbName;
            ReportsStore.changes.get(
                {feed:'longpoll', since: ReportsStore.lastseq},
                function(data){
                    if(data.last_seq > ReportsStore.lastseq) {
                        // If the user asked to stop polling or changed DataBase, don't handle the result.
                        if(ReportsStore.continuePolling && ReportsStore.dbName === currentlyPolledDB && pollCount === ReportsStore.pollCounter) {
                            console.log("New changes (poller " + pollCount + ")");
                            cb();
                            ReportsStore.lastseq = data.last_seq;
                        }
                    }
                    if(ReportsStore.continuePolling  && ReportsStore.dbName === currentlyPolledDB && pollCount === ReportsStore.pollCounter) {
                        console.log("poller " + pollCount + " continues");
                        ReportsStore.pollChanges(cb, pollCount);
                    } else {
                        console.log("poller " + pollCount + " stops");
                    }
                },
                function() {
                    console.log("Error while polling changes");
                    if(ReportsStore.continuePolling) {
                        ReportsStore.pollChanges(cb);
                    }
                }
            );
        };

        ReportsStore.startPolling = function(cb) {
            ReportsStore.dbstate.get(
                {},
                // Success
                function(data) {
                    if(ReportsStore.lastseq === -1) {
                        ReportsStore.lastseq = data.update_seq;
                    }
                    console.log("DB status retrieved, last_seq = " + ReportsStore.lastseq);
                    ReportsStore.continuePolling = true;
                    ReportsStore.pollCounter++;
                    ReportsStore.pollChanges(cb, ReportsStore.pollCounter);
                },
                // Error
                function() {
                    ReportsStore.continuePolling = false;
                    $rootScope.$broadcast(acralyzerEvents.POLLING_FAILED);
                    console.log("Polling failed");
                }
            );
        };

        ReportsStore.stopPolling = function() {
            console.log("STOP POLLING !");
            ReportsStore.continuePolling = false;
        };

        return ReportsStore;
    });

})(window.acralyzerConfig,window.angular,window.acralyzerEvents,window.acralyzer);
