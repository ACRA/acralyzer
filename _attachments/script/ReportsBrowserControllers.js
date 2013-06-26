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
(function(acralyzerConfig,angular,acralyzer,acralyzerEvents,Showdown) {
    "use strict";

    function ReportsBrowserCtrl($scope, ReportsStore, $routeParams) {
        if($routeParams.app) {
            console.log("ReportsBrowser: Direct access to app " + $routeParams.app);
            $scope.acralyzer.setApp($routeParams.app);
        } else {
            console.log("ReportsBorwser: Access to default app " + acralyzerConfig.defaultApp);
            $scope.acralyzer.setApp(acralyzerConfig.defaultApp);
        }

        console.log("Init ReportsBrowserCtrl");
        $scope.paginator = {
            pageSize: 15,
            currentPage: 0
        };
        $scope.pageSizeList = [15, 30, 50, 100];

        $scope.previousStartKeys = [];
        $scope.selectedReport = "";
        $scope.startKey = null;
        $scope.nextKey = null;
        $scope.startNumber = 1;
        $scope.endNumber = $scope.paginator.pageSize;
        $scope.fullSearch = false;
        $scope.loading = true;
        $scope.noFilter = { value: "false", label: "Select filter"};
        $scope.noFilterValue = { value: "false", label: "All values"};
        $scope.availableFilters = [
            $scope.noFilter,
            {value: "appver", label: "Application version"},
            {value: "androidver", label: "Android version"}
        ];
        $scope.filterName = $scope.noFilter;
        $scope.filterValue = $scope.noFilterValue;

        $scope.filterValues = [];

        // Filtering by bugId
        $scope.bugId = $routeParams.bugId;
        $scope.bug = null;

        // Filtering by installation_id
        if($routeParams.installationId) {
            $scope.selectedUser = { installationId: $routeParams.installationId };
        }

        $scope.incPage = function() {
            $scope.previousStartKeys.push($scope.startKey);
            $scope.startKey = $scope.nextKey;
            $scope.getData();
        };

        $scope.decPage = function() {
            $scope.nextKey = null;
            $scope.startKey = $scope.previousStartKeys.pop();
            $scope.getData();
        };

        $scope.isFirstPage = function() {
            return $scope.previousStartKeys.length <= 0;
        };

        $scope.isLastPage = function() {
            return $scope.nextKey === null;
        };

        $scope.firstPage = function() {
            $scope.startKey = null;
            $scope.nextKey = null;
            $scope.getData();
        };

        $scope.$watch('paginator.pageSize', function(newValue, oldValue){
            if (newValue !== oldValue) {
                $scope.firstPage();
            }
        });

        $scope.getData = function() {
            $scope.loading = true;
            var successHandler = function(data) {
                // Success Handler
                $scope.reports = data.rows;
                $scope.totalReports = data.total_rows;

                // If there are more rows, here is the key to the next page
                $scope.nextKey =data.next_row ? data.next_row.key : null;
                $scope.startNumber = ($scope.previousStartKeys.length * $scope.paginator.pageSize) + 1;
                $scope.endNumber = $scope.startNumber + $scope.reports.length - 1;

                $scope.loading = false;
            };

            var errorHandler = function(response, getResponseHeaders){
                // Error Handler
                $scope.reports=[];
                $scope.totalReports="";
            };

            if(($scope.filterName === $scope.noFilter || $scope.filterValue === $scope.noFilterValue) && !$scope.bug && !$scope.selectedUser) {
                ReportsStore.reportsList($scope.startKey, $scope.paginator.pageSize, $scope.fullSearch, successHandler, errorHandler);
            } else if($scope.filterName !== $scope.noFilter && $scope.filterValue !== $scope.noFilterValue){
                ReportsStore.filteredReportsList($scope.filterName.value, $scope.filterValue.value,$scope.startKey, $scope.paginator.pageSize, $scope.fullSearch, successHandler, errorHandler);
            } else if($scope.bug) {
                if($scope.selectedUser) {
                    // Filter by bug AND user
                    var filterKey = $scope.bug.key.slice(0);
                    filterKey.push($scope.selectedUser.installationId);
                    ReportsStore.filteredReportsList("bug-by-installation-id", filterKey, $scope.startKey, $scope.paginator.pageSize, $scope.fullSearch, successHandler, errorHandler);
                } else {
                    // Filter by bug only
                    ReportsStore.filteredReportsList("bug", $scope.bug.key, $scope.startKey, $scope.paginator.pageSize, $scope.fullSearch, successHandler, errorHandler);
                }
            } else if($scope.selectedUser) {
                // Filter by user only
                ReportsStore.filteredReportsList("installation-id", $scope.selectedUser.installationId, $scope.startKey, $scope.paginator.pageSize, $scope.fullSearch, successHandler, errorHandler);
            }
        };

        $scope.changeFilterValues = function() {

            if($scope.filterName === $scope.noFilter) {
                $scope.filterValue = $scope.noFilterValue;
                $scope.filterValueSelected();
            } else {
                var getFilteredValues;
                if($scope.filterName.value === "androidver") {
                    getFilteredValues = ReportsStore.androidVersionsList;
                } else if ($scope.filterName.value === "appver") {
                    getFilteredValues = ReportsStore.appVersionsList;
                }

                if(getFilteredValues) {
                    getFilteredValues(function(data){
                        console.log("Update filter values");
                        $scope.filterValues.length = 0;
                        $scope.filterValues.push($scope.noFilterValue);
                        for(var row = 0; row < data.rows.length; row++) {
                            $scope.filterValues.push({value:data.rows[row].key[0], label:data.rows[row].key[0]});
                        }
                        $scope.filterValues.sort();
                    });
                }
            }
        };

        $scope.filterValueSelected = function() {
            // reset pagination
            $scope.startKey = null;
            $scope.nextKey = null;
            $scope.previousStartKeys.length = 0;
            $scope.getData();
        };

        $scope.loadReport = function(report) {
            $scope.selectedReport = ReportsStore.reportDetails(report.id, function(data) {
                data.readableUptime = moment.duration(data.uptime, 'seconds').humanize();
                data.formatedCrashDate = moment(data.USER_CRASH_DATE).format('LLL');
                data.formatedTimestamp = moment(data.timestamp).format('LLL');
            });
        };

        $scope.deleteReport = function(report) {
            if($scope.selectedReport === report) {
                $scope.selectedReport = "";
            }

            ReportsStore.deleteReport(report, function(data) {
                var index = $scope.reports.indexOf(report);
                $scope.reports.splice(index, 1);
            });
        };

        if($scope.bugId) {
            ReportsStore.getBugForId($scope.bugId, function(bug){
                // success callback
                $scope.bug = bug;
                $scope.bug.editMode = false;
                $scope.bug.toggleEditMode = function() {
                    if($scope.bug.editMode && $scope.bug.initialDescription !== $scope.bug.value.description) {
                        // User has modified the description and wants to save it
                        $scope.bug.updating = true;
                        ReportsStore.saveBug(bug, function() {
                            $scope.bug.updating = false;
                            $scope.bug.initialDescription = $scope.bug.value.description;
                        });
                    }
                    $scope.bug.editMode = !$scope.bug.editMode;
                };

                $scope.bug.initialDescription = $scope.bug.value.description;
                $scope.bug.revertDescription = function() {
                    $scope.bug.value.description = $scope.bug.initialDescription;
                };

                $scope.getData();
            });
        } else {
            $scope.getData();
        }

        var converter = new Showdown.converter({extensions:['github','table']});

        // When description is updated, re-generate its rendered html version
        $scope.$watch('bug.value.description', function(newValue, oldValue) {
            if(newValue !== oldValue) {
                $scope.bug.descriptionHtml = converter.makeHtml(newValue);
            }
        });


        $scope.filterWithUser = function(user) {
            console.log("Selected user:", user);
            $scope.selectedUser = user;
            $scope.firstPage();
            $scope.getData();
        };

        $scope.$on(acralyzerEvents.LOGGED_IN, $scope.getData);
        $scope.$on(acralyzerEvents.LOGGED_OUT, $scope.getData);
    }


    acralyzer.controller('ReportsBrowserCtrl', ["$scope", "ReportsStore", "$routeParams", ReportsBrowserCtrl]);

})(window.acralyzerConfig,window.angular,window.acralyzer,window.acralyzerEvents,window.Showdown);
