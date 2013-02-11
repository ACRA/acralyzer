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

function AcralyzerCtrl($scope, ReportsStore, $rootScope) {
    $scope.acralyzer = {
        apps: []
    };
    $scope.acralyzer.app = acralyzerConfig.defaultApp;

    $scope.acralyzer.setApp = function(appName) {
        $scope.acralyzer.app = appName;
        ReportsStore.setApp($scope.acralyzer.app);
    }

    ReportsStore.listApps(function(data) {
        console.log("Storage list retrieved.");
        $scope.acralyzer.apps.length = 0;
        $scope.acralyzer.apps = data;
        console.log($scope.acralyzer.apps);
    }, function() {

    });


    ReportsStore.startPolling(function(){
        $rootScope.$broadcast("refresh");
    });
}
