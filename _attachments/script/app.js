var acralyzer = angular.module('Acralyzer', ['acra-storage']);

acralyzer.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/dashboard', {templateUrl: 'partials/dashboard.html',   controller: DashboardCtrl, activetab: "dashboard"}).
        when('/reports-browser', {templateUrl: 'partials/reports-browser.html', controller: ReportsBrowserCtrl, activetab: "reportsBrowser"}).
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
                    
                    if (value!='') {
                        // Register watcher on evaluated expression
                        $scope.$watch(function watcher(){
                            return $scope.$eval(value);
                        },dopp,true);
                    } else {
                        // Watch entire scope
                        $scope.$watch(dopp);
                    }
                    
                    function dopp(inspect){
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
                    }
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
            report: '='
        },
        templateUrl: 'partials/report-details.html'
    };
});

(function(acra, $, undefined ) {
    //Private Property
    var isHot = true;

    //Public Property
    acra.dbname = "acra-storage";
    acra.design = acra.dbname;

    //Public Method
    acra.getViewUrl = function(view, options) {
        var result = "/" + acra.dbname + "/_design/" + acra.design + "/_view/" + view;
        if (options) {
            result += "?" + options;
        }
        return result;
    }

    acra.getDocUrl = function(docId) {
        var result = "/" + acra.dbname + "/" + docId;
    }

    acra.addEvent = function(elem, type, eventHandle) {
        if (elem == null || elem == undefined) return;
        if ( elem.addEventListener ) {
            elem.addEventListener( type, eventHandle, false );
        } else if ( elem.attachEvent ) {
            elem.attachEvent( "on" + type, eventHandle );
        } else {
            elem["on"+type]=eventHandle;
        }
    };

    // TODO: Remove the signature computation when a large amount of reports have been generated with their own signature.
    acra.getReportSignature = function(report) {
        if(report.value.signature) {
            return report.value.signature;
        } else {
            var result = { full: "", digest: ""};
            var stack = report.value.stack_trace;
            if(stack.length > 1) {
                var exceptionName =  stack[0];
                var faultyLine = stack[1];
                var applicationPackage = report.value.application_package;
                for(var line in stack) {
                    if(stack[line].indexOf(applicationPackage) >= 0) {
                        faultyLine = stack[line];
                        break;
                    }
                }
                result.full = exceptionName + " : " + faultyLine;

                var captureRegEx = /\((.*)\)/g;
                var regexResult =  captureRegEx.exec(faultyLine);
                var faultyLineDigest = faultyLine;
                if(regexResult && regexResult.length >= 2) {
                    faultyLineDigest = regexResult[1];
                }
                result.digest = exceptionName + " : " + faultyLineDigest;
                return result;
            }
        }
    }

    acra.readableTimeSpan = function(seconds){

        var numyears = Math.floor(seconds / 31536000);
        if(numyears){
            return numyears + ' year' + ((numyears > 1) ? 's' : '');
        }
        var numdays = Math.floor((seconds % 31536000) / 86400);
        if(numdays){
            return numdays + ' day' + ((numdays > 1) ? 's' : '');
        }
        var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
        if(numhours){
            return numhours + ' hour' + ((numhours > 1) ? 's' : '');
        }
        var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
        if(numminutes){
            return numminutes + ' minute' + ((numminutes > 1) ? 's' : '');
        }
        var numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
        if(numseconds){
            return numseconds + ' second' + ((numseconds > 1) ? 's' : '');
        }
        return '< 1 second'; //'just now' //or other string you like;
    }

    acra.reportDetailsHeaderKeyNames = [
        "timestamp",
        "USER_APP_START_DATE",
        "USER_CRASH_DATE",
        "APP_VERSION_CODE",
        "APP_VERSION_NAME",
        "INSTALLATION_ID",
        "STACK_TRACE",
        "CUSTOM_DATA",
        "USER_EMAIL",
        "USER_COMMENT"
    ];

}( window.acra = window.acra || {}, jQuery ));




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

    $.couchProfile.templates.profileReady = $("#new-message").html();
    $("#account").couchLogin({
        loggedIn : function(r) {
            $("#profile").couchProfile(r, {
                profileReady : function(profile) {
                    $("#create-message").submit(function(e){
                        e.preventDefault();
                        var form = this, doc = $(form).serializeObject();
                        doc.created_at = new Date();
                        doc.profile = profile;
                        db.saveDoc(doc, {success : function() {form.reset();}});
                        return false;
                    }).find("input").focus();
                }
            });

            scope = angular.element(document).scope();
            scope.$apply(function($rootScope){
                $rootScope.$broadcast("refresh");
            });
        },
        loggedOut : function() {
            scope = angular.element(document).scope();
            scope.$apply(function($rootScope){
                $rootScope.$broadcast("refresh");
            });
            $("#profile").html('<p>Please log in to see your profile.</p>');
        }
    });
 });