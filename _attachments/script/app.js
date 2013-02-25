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
(function(acralyzerConfig) {
"use strict";

var acralyzer = window.acralyzer = angular.module('Acralyzer', ['acra-storage']);

acralyzer.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/dashboard', {templateUrl: 'partials/dashboard.html',   controller: 'DashboardCtrl', activetab: "dashboard"}).
        when('/dashboard/:app', {templateUrl: 'partials/dashboard.html',   controller: 'DashboardCtrl', activetab: "dashboard"}).
        when('/reports-browser', {templateUrl: 'partials/reports-browser.html', controller: 'ReportsBrowserCtrl', activetab: "reports-browser"}).
        when('/reports-browser/:app', {templateUrl: 'partials/reports-browser.html', controller: 'ReportsBrowserCtrl', activetab: "reports-browser"}).
        when('/report-details/:app/:reportId', {templateUrl: 'partials/report-details.html', controller: 'ReportDetailsCtrl', activetab: "none"}).
        otherwise({redirectTo: '/dashboard'});
    }]);

acralyzer.directive('prettyprint',function(){
        return {
            restrict: 'A',
            link:function($scope,$element,$attr){
                // Persistent container for json output
                var $json = $('<div>');
                $element.prepend($json);

                $attr.$observe('prettyprint',function(value){
                    var dopp;

                    if (value !== '') {
                        // Register watcher on evaluated expression
                        $scope.$watch(function watcher(){
                            return $scope.$eval(value);
                        },dopp,true);
                    } else {
                        // Watch entire scope
                        $scope.$watch(dopp);
                    }

                    dopp = function (inspect){
                        // Replace contents of persistent json container with new json table
                        $json.empty();
                        $json.append(prettyPrint(inspect, {
                            // Config
//                            maxArray: 20, // Set max for array display (default: infinity)
                            expanded: false, // Expanded view (boolean) (default: true),
                            maxDepth: 5, // Max member depth (when displaying objects) (default: 3)
                            sortKeys: true,
                            stringsWithDoubleQuotes: false,
                            classes: {
                                'default': {
                                    table: "none",
                                    th: "none"
                                }
                            }
                        }));
                    };
                });
            }
        };
    });

acralyzer.directive('reportSummary', function() {
    return {
        restrict: 'E',
        scope: {
            report: '='
        },
        templateUrl: 'partials/report-summary.html'
    };
});

acralyzer.directive('reportDetails', function() {
    return {
        restrict: 'E',
        scope: {
            report: '=',
            acralyzer: '='
        },
        templateUrl: 'partials/report-details.html'
    };
});

acralyzer.factory('desktopNotifications', [function() {
    /* data is an object with 'title', 'body' and optional 'icon' keys */
    if ("Notification" in window && window.Notification.permissionLevel) {
        return {
            notify: function(data) {
                if (window.Notification.permissionLevel() !== "granted") { return; }

                var notif = new window.Notification(data.title, data);
                notif.onshow = function() {
                    setTimeout(function(){
                        notif.close();
                    }, '10000');
                };
                notif.show();
            }
        };
    }
    else if (window.webkitNotifications) {
        return {
            notify: function(data) {
                if (window.webkitNotifications.checkPermission()) { return; }

                var notif = window.webkitNotifications.createNotification(data.icon, data.title, data.body);
                notif.onshow = function() {
                    setTimeout(function(){
                        notif.close();
                    }, '10000');
                };
                notif.show();
            }
        };
    }
}]);

acralyzer.directive('notificationsSupport', [function() {
    return {
        restrict: 'A',
        link: function(scope,elm,attrs,controller) {
            if ("Notification" in window && window.Notification.permissionLevel) {
                if (window.Notification.permissionLevel() === "default") {
                    elm.on('click', function(ev) {
                        window.Notification.requestPermission(function () {
                            elm.remove();
                        });
                    });
                    return;
                }
            }
            else if (window.webkitNotifications) {
                if (window.webkitNotifications.checkPermission() === 1) {
                    elm.on('click', function(ev) {
                        window.webkitNotifications.requestPermission(function () {
                            elm.remove();
                        });
                    });
                    return;
                }
            }
            /* Not allowed or not supported */
            elm.remove();
        }
    };
}]);

// TODO: migrate this code to angular logic
///////////////////////////////////
// Apache 2.0 J Chris Anderson 2011
$(function() {
    // friendly helper http://tinyurl.com/6aow6yn
    $.fn.serializeObject = function() {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    $("#account").couchLogin({
        loggedIn : function(r) {
            var scope = angular.element(document).scope();
            scope.$apply(function($rootScope){
                $rootScope.$broadcast("refresh");
            });
        },
        loggedOut : function() {
            var scope = angular.element(document).scope();
            scope.$apply(function($rootScope){
                $rootScope.$broadcast("refresh");
            });
        }
    });
 });
})(window.acralyzerConfig);
