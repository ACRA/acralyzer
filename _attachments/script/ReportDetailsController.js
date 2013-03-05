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
(function(acralyzerConfig,angular,acralyzer) {
    "use strict";

    function ReportDetailsCtrl($scope, $routeParams, ReportsStore) {
        $scope.acralyzer.setApp($routeParams.app);
        $scope.reportId = $routeParams.reportId;
        $scope.loadReport = function(reportId) {
            $scope.report = ReportsStore.reportDetails(reportId, function(data) {
                data.readableUptime = moment.duration(data.uptime, 'seconds').humanize();
                data.formatedCrashDate = moment(data.USER_CRASH_DATE).format('LLL');
                data.formatedTimestamp = moment(data.timestamp).format('LLL');
            });
        };
        $scope.loadReport($scope.reportId);

    }

    acralyzer.controller('ReportDetailsCtrl',["$scope", "$routeParams", "ReportsStore",ReportDetailsCtrl]);
})(window.acralyzerConfig,window.angular,window.acralyzer);
