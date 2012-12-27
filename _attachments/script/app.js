angular.module('Acralyzer', ['acra-storage'])
    .config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/dashboard', {templateUrl: 'partials/dashboard.html',   controller: DashboardCtrl}).
        when('/reports-browser', {templateUrl: 'partials/reports-browser.html', controller: ReportsBrowserCtrl}).
        otherwise({redirectTo: '/dashboard'});
    }])
    .directive('prettyprint',function(){
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
                                    table: "table table-condensed span10"
                                }
                            }
                        }));
                    }
                });
            }
        };
    });


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
 /*           e = document.getElementById('content');
            scope = angular.element(e).scope();
            if(scope) {
                scope.$apply(function() {
                   scope.getData();
                });
                e = document.getElementById('graph-container');
                scope = angular.element(e).scope();
                scope.$apply(function() {
                   scope.getData();
                });

                e = document.getElementById('pie-charts');
                scope = angular.element(e).scope();
                scope.$apply(function() {
                    scope.getData();
                });
            }
  */
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