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

    function AdminCtrl($scope, ReportsStore) {
        $scope.daysToKeep = 90;

        $scope.purge = function() {
            console.log("Purge reports older than " + $scope.daysToKeep);
            console.log("key will be: " + moment().subtract('days', $scope.daysToKeep).format("[[]YYYY,M,d[]]"));
        };
    }
    acralyzer.controller('AdminCtrl', ["$scope", "ReportsStore", AdminCtrl]);

})(window.acralyzerConfig,window.angular,window.acralyzer,window.acralyzerEvents,window.jQuery);
