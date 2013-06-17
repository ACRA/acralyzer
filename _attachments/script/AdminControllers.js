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

(function(acralyzerConfig,angular,acralyzer,acralyzerEvents,location,moment) {
    "use strict";

    function AdminCtrl($scope, ReportsStore, $routeParams, $notify, $user, $http) {
        if($routeParams.app) {
            console.log("ReportsBrowser: Direct access to app " + $routeParams.app);
            $scope.acralyzer.setApp($routeParams.app);
        } else {
            console.log("ReportsBorwser: Access to default app " + acralyzerConfig.defaultApp);
            $scope.acralyzer.setApp(acralyzerConfig.defaultApp);
        }

        // REPORTS PURGES
        $scope.daysToKeep = 90;
        $scope.selectedVersion = "";
        $scope.appVersionCodes = [];
        $scope.purgingByDays = false;
        $scope.purgingByAppVersionCode = false;
        $scope.nbReportsByDaysToPurge = "";
        $scope.nbReportsByAppVersionCodeToPurge = "";

        ReportsStore.appVersionCodesList(function(data){
            $scope.appVersionCodes.length = 0;
            for(var row = 0; row < data.rows.length; row++) {
                $scope.appVersionCodes.push({value:data.rows[row].key[0], label:data.rows[row].key[0]});
            }
        });

        $scope.purgeDays = function(daysToKeep) {
            $scope.purgingByDays = true;
            var deadline = moment().subtract('days', daysToKeep);
            console.log("Purge reports older than " + daysToKeep);
            console.log("key will be: " + deadline.format("[[]YYYY,M,d[]]"));
            ReportsStore.purgeReportsOlderThan(deadline.year(), deadline.month(), deadline.date(),
                function(nbReports) {
                    // Intermediate callback
                    $scope.nbReportsByDaysToPurge = nbReports;
                },
                function(data) {
                    // Success callback
                    $scope.purgingByDays = false;
                    $scope.nbReportsByDaysToPurge = "";
                    $notify.success({
                        desktop: true,
                        timeout: 10000,
                        title: "Acralyzer - " + $scope.acralyzer.app,
                        body: "Purge of " + data.length + " reports succeeded, keeping the last " + daysToKeep + " days.",
                        icon: "img/loader.gif"
                    });
                },
                function(){
                    // Failure callback
                    $scope.purgingByDays = false;
                    $scope.nbReportsByDaysToPurge = "";
                    $notify.success({
                        desktop: true,
                        timeout: 10000,
                        title: "Acralyzer - " + $scope.acralyzer.app,
                        body: "Purge failed.",
                        icon: "img/loader.gif"
                    });
                }
            );
        };

        $scope.purgeVersion = function(selectedVersion) {
            $scope.purgingByAppVersionCode = true;
            console.log("Purge reports from version " + selectedVersion + " and older.");
            console.log(selectedVersion);
            ReportsStore.purgeReportsFromAppVersionCodeAndBelow(selectedVersion,
                function(nbReports) {
                    // Intermediate callback
                    $scope.nbReportsByAppVersionCodeToPurge = nbReports;
                },
                function(data) {
                    // Success callback
                    ReportsStore.appVersionCodesList();
                    $scope.purgingByAppVersionCode = false;
                    $scope.nbReportsByAppVersionCodeToPurge = "";
                    $notify.success({
                        desktop: true,
                        timeout: 10000,
                        title: "Acralyzer - " + $scope.acralyzer.app,
                        body: "Purge of " + data.length + " reports succeeded, from " + selectedVersion + " and below.",
                        icon: "img/loader.gif"
                    });
                },
                function(){
                    // Failure callback
                    $scope.purgingByAppVersionCode = false;
                    $scope.nbReportsByAppVersionCodeToPurge = "";
                    $notify.success({
                        desktop: true,
                        timeout: 10000,
                        title: "Acralyzer - " + $scope.acralyzer.app,
                        body: "Purge failed.",
                        icon: "img/loader.gif"
                    });
                }
            );
        };

        // USER PREFERENCES
        $scope.acralyzerConfig = acralyzerConfig;
        $scope.apps = [];
        ReportsStore.listApps(function(appsList) {
            $scope.apps = appsList;
        });

        $scope.storeDefaultApp = function() {
            $user.updatePreferences({
                defaultApp: acralyzerConfig.defaultApp
            });
        };

        // USERS MANAGEMENT
        $scope.formUri = 'http://' + location.host + '/' + acralyzerConfig.appDBPrefix + $scope.acralyzer.app + '/_design/acra-storage/_update/report';
        $scope.createReporterUser = function(login, password) {
            console.log("Transfer user creation to $user ", login, password);
            $user.addReporterUser(login, password, function(){
                $scope.newReporterCreated = true;
            });
        };
    }
    acralyzer.controller('AdminCtrl', ["$scope", "ReportsStore", "$routeParams", "$notify", "$user", "$http", AdminCtrl]);

})(window.acralyzerConfig,window.angular,window.acralyzer,window.acralyzerEvents,window.location,window.moment);
