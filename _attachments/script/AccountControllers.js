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
(function(acralyzerConfig,angular,acralyzer,acralyzerEvents) {
"use strict";

function AccountCtrl($rootScope, $scope, $user, $dialog) {
    $rootScope.$on(acralyzerEvents.LOGIN_CHANGE, function(event, $user) {
        $scope.username = $user.username;
        $scope.isAdmin  = $user.isAdmin;
    });

    $scope.showLogin = function() {
        var d = $dialog.dialog({
            templateUrl: 'partials/login-dialog.html',
            controller:  'LoginDialogCtrl'
        });
        d.open().then(function(result){
        });
    };
    $scope.showChangePassword = function() {
        var d = $dialog.dialog({
            templateUrl: 'partials/change-password.html',
            controller:  'ChangePasswordDialogCtrl'
        });
        d.open().then(function(result){
        });
    };

    $scope.logout = function() {
        $user.logout();
    };
}

function LoginDialogCtrl($scope, $user, dialog) {
    $scope.username = "";
    $scope.password = "";
    $scope.pending = false;
    $scope.badUsername = false;

    $scope.close = function(result) {
        if (this.disabled) { return; }
        $scope.pending = true;
        $scope.badUsername = false;
        $user.login($scope.username, $scope.password).then(
            function(data) {
                $scope.pending = false;
                dialog.close();
            },
            function(data) {
                $scope.badUsername = true;
                $scope.pending = false;
            }
        );

    };
}

function ChangePasswordDialogCtrl($scope, $user, dialog) {
    $scope.password = "";
    $scope.confirm_password = "";
    $scope.pending = false;

    $scope.close = function(password) {
        if (this.disabled) { return; }
        $scope.pending = true;
        $user.changePassword(password).then(
            function() {
                /* success */
                $scope.pending = false;
                dialog.close($scope.password);
            },
            function() {
                /* error */
                $scope.pending = false;
                dialog.close($scope.password);
            }
        );
    };
}

acralyzer.controller('AccountCtrl', ['$rootScope', '$scope','$user','$dialog', AccountCtrl]);
acralyzer.controller('LoginDialogCtrl', ['$scope','$user','dialog', LoginDialogCtrl]);
acralyzer.controller('ChangePasswordDialogCtrl', ['$scope', '$user', 'dialog', ChangePasswordDialogCtrl]);

})(window.acralyzerConfig,window.angular,window.acralyzer, window.acralyzerEvents);
