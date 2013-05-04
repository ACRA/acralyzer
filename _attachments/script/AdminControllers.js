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

(function(acralyzerConfig,angular,acralyzer,acralyzerEvents,$) {
    "use strict";

    function AdminCtrl($scope, ReportsStore, $routeParams, $notify) {
        if($routeParams.app) {
            console.log("ReportsBrowser: Direct access to app " + $routeParams.app);
            $scope.acralyzer.setApp($routeParams.app);
        } else {
            console.log("ReportsBorwser: Access to default app " + acralyzerConfig.defaultApp);
            $scope.acralyzer.setApp(acralyzerConfig.defaultApp);
        }

        $scope.daysToKeep = 90;

        $scope.purge = function() {
            var deadline = moment().subtract('days', $scope.daysToKeep);
            console.log("Purge reports older than " + $scope.daysToKeep);
            console.log("key will be: " + deadline.format("[[]YYYY,M,d[]]"));
            ReportsStore.purgeReportsOlderThan(deadline.year(), deadline.month(), deadline.date(),
                function(data) {
                    // Success callback
                    $notify.success({
                        desktop: true,
                        timeout: 10000,
                        title: "Acralyzer - " + $scope.acralyzer.app,
                        body: "Purge of " + data.length + " reports succeeded, keeping the last " + $scope.daysToKeep + " days.",
                        icon: "img/loader.gif"
                    });
                },
                function(){
                    // Failure callback
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
    }
    acralyzer.controller('AdminCtrl', ["$scope", "ReportsStore", "$routeParams", "$notify", AdminCtrl]);

})(window.acralyzerConfig,window.angular,window.acralyzer,window.acralyzerEvents,window.jQuery);
