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

function AccountCtrl($scope, $dialog) {
    $scope.username = null;

    var updateState = function() {
        window.jQuery.couch.session({
            success : function(session) {
                var userCtx = session.userCtx;
                $scope.$apply(function() {
                    if (userCtx.name) {
                        /* logged in */
                        $scope.username = userCtx.name;
                    } else {
                        /* Logged out */
                        $scope.username = null;
                    }
                });
            }
        });
    };

    updateState();
    $scope.showLogin = function() {
        var d = $dialog.dialog({
            templateUrl: 'partials/login-dialog.html',
            controller:  'LoginDialogCtrl'
        });
        d.open().then(function(result){
            if(result.username && result.password)
            {
                window.jQuery.couch.login({name:result.username,password:result.password, success : updateState});
            }
        });
    };
    $scope.showChangePassword = function() {
        var d = $dialog.dialog({
            templateUrl: 'partials/change-password.html',
            controller:  'ChangePasswordDialogCtrl'
        });
        d.open().then(function(newPassword){
            if($scope.username && newPassword)
            {
                window.jQuery.couch.userDb(function(db) {
                    var userDocId = "org.couchdb.user:"+$scope.username;
                    db.openDoc(userDocId, {
                        success : function(userDoc) {
                            console.log(userDoc);
                            /*
                            userDoc["couch.app.profile"] = newProfile;
                            db.saveDoc(userDoc, {
                                success : function() {
                                    newProfile.name = userDoc.name;
                                    profileReady(newProfile);
                                }
                            });
                            */
                        }
                    });
                });
            }
        });
    };

    $scope.logout = function() {
        window.jQuery.couch.logout({success : updateState});
    };
}

function LoginDialogCtrl($scope, dialog) {
    $scope.username = "";
    $scope.password = "";

    $scope.close = function(result) {
        if (this.disabled) { return; }
        dialog.close({ username: $scope.username, password: $scope.password });
    };
}

function ChangePasswordDialogCtrl($scope, dialog) {
    $scope.close = function(password) {
        dialog.close(password);
    };
}

acralyzer.controller('AccountCtrl', ['$scope','$dialog', AccountCtrl]);
acralyzer.controller('LoginDialogCtrl', ['$scope','dialog', LoginDialogCtrl]);
acralyzer.controller('ChangePasswordDialogCtrl', ['$scope', 'dialog', ChangePasswordDialogCtrl]);

})(window.acralyzerConfig,window.angular,window.acralyzer);

