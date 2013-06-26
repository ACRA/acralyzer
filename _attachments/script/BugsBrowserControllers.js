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

    function BugsBrowserCtrl($scope, ReportsStore, $routeParams) {
        if($routeParams.app) {
            console.log("BugsBrowser: Direct access to app " + $routeParams.app);
            $scope.acralyzer.setApp($routeParams.app);
        } else {
            console.log("BugsBorwser: Access to default app " + acralyzerConfig.defaultApp);
            $scope.acralyzer.setApp(acralyzerConfig.defaultApp);
        }

        console.log("Init BugsBrowserCtrl");
        $scope.bugsList = [];
        $scope.bugsCount = 15;
        $scope.hideSolvedBugs = true;
        $scope.previousStartKeys = [];
        $scope.startKey = null;
        $scope.nextKey = null;
        $scope.startNumber = 1;
        $scope.endNumber = $scope.bugsCount;
        $scope.fullSearch = false;
        $scope.loading = true;
        $scope.noFilter = { value: "false", label: "Select filter"};
        $scope.noFilterValue = { value: "false", label: "All values"};
        $scope.availableFilters = [
            {value: "appvercode", label: "Application version code"}
        ];
        $scope.filterName = $scope.noFilter;
        $scope.filterValue = $scope.noFilterValue;

        $scope.filterValues = [];
        $scope.orderField = 'value.count';
        $scope.orderDescending = true;

        // List animations
        $scope.animationFade = {
            enter: 'fade-enter',
            leave: 'fade-leave'
        };
        $scope.animationNextPage = {
            enter: 'nextpage-enter',
            leave: 'nextpage-leave'
        };
        $scope.animationPreviousPage = {
            enter: 'previouspage-enter',
            leave: 'previouspage-leave'
        };
        $scope.listAnimation = $scope.animationFade;

        $scope.setNextPageAnimation = function() {
            $scope.listAnimation = $scope.animationNextPage;
            console.log("setNextPageAnimation");
        };

        $scope.setPreviousPageAnimation = function() {
            $scope.listAnimation = $scope.animationPreviousPage;
            console.log("setPreviousPageAnimation");
        };

        $scope.getListAnimation = function() {
            return $scope.listAnimation;
        };

        /**
         * Takes two lists of bugs and merges the second one into the first one.
         * New bugs are added, bugs absent from list2 are removed from list1, and updated bugs are examined to update
         * the values from list1 with those from list2.
         * This is necessary to allow to animate only changes.
         * @param list1 Original list.
         * @param list2 New list.
         */
        var mergeBugsLists = function(list1, list2) {
            var bugslist = {};
            for(var i1 = 0; i1 < list1.length; i1++) {
                bugslist[list1[i1].id] = {idxlist1: i1};
            }
            for(var i2 = 0; i2 < list2.length; i2++) {
                if(!bugslist[list2[i2].id]){
                    // Mark bug as not found in list1
                    bugslist[list2[i2].id] = {idxlist1: -1};
                }
                bugslist[list2[i2].id].idxlist2 = i2;
            }
            for(var iBugs in bugslist) {
                if(bugslist[iBugs].idxlist1 < 0 && bugslist[iBugs].idxlist2 >= 0) {
                    // New bug
                    list1.push(list2[bugslist[iBugs].idxlist2]);
                } else if (bugslist[iBugs].idxlist1 >= 0 && bugslist[iBugs].idxlist2 < 0) {
                    // Deleted bug
                    list1.splice(bugslist[iBugs].idxlist1, 1);
                } else if(bugslist[iBugs].idxlist1 >= 0 && bugslist[iBugs].idxlist2 >= 0) {
                    if(!list1[bugslist[iBugs].idxlist1].equals(list2[bugslist[iBugs].idxlist2])) {
                        // Updated bug
                        list1[bugslist[iBugs].idxlist1].updateWithBug(list2[bugslist[iBugs].idxlist2]);
                    }
                }
            }
        };


        $scope.getData = function() {
//            $scope.loading = true;
            ReportsStore.bugsList(function(data) {
                    $scope.listAnimation = $scope.animationFade;
                    console.log("Refresh data for latest bugs");
                    console.log(data);
                    mergeBugsLists($scope.bugsList, data.rows);
                    $scope.totalBugs = data.total_rows;
                    for(var row = 0; row < $scope.bugsList.length; row++) {
                        $scope.bugsList[row].latest = moment($scope.bugsList[row].value.latest).fromNow();
                    }
                    $scope.loading = false;
                },
                function(response, getResponseHeaders){
                    $scope.bugsList=[];
                    $scope.totalBugs="";
                    $scope.loading = false;
                }
            );
        };

        $scope.shouldBeDisplayed = function(bug) {
            if($scope.hideSolvedBugs && bug.value.solved) {
                return false;
            } else {
                return true;
            }
        };

        $scope.filterValueSelected = function() {
            // reset pagination
            $scope.startKey = null;
            $scope.nextKey = null;
            $scope.previousStartKeys.length = 0;
            $scope.getData();
        };

        $scope.$on(acralyzerEvents.LOGGED_IN, $scope.getData);
        $scope.$on(acralyzerEvents.LOGGED_OUT, $scope.getData);
        $scope.$on(acralyzerEvents.BUGS_UPDATED, $scope.getData);
        $scope.getData();
    }


    acralyzer.controller('BugsBrowserCtrl', ["$scope", "ReportsStore", "$routeParams", BugsBrowserCtrl]);

})(window.acralyzerConfig,window.angular,window.acralyzer,window.acralyzerEvents);
