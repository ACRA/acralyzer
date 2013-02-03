function ReportsBrowserCtrl($scope, ReportsStore) {
    console.log("Init ReportsBrowserCtrl");
    $scope.reportsCount = 15;
    $scope.previousStartKeys = [];
    $scope.selectedReport = "";
    $scope.startKey = null;
    $scope.nextKey = null;
    $scope.startNumber = 1;
    $scope.endNumber = $scope.reportsCount;
    $scope.fullSearch = false;
    $scope.loading = true;
    $scope.noFilter = { value: "false", label: "No filter"};
    $scope.noFilterValue = { value: "false", label: "All values"};
    $scope.availableFilters = [
        $scope.noFilter,
        {value: "appver", label: "Application version"},
        {value: "androidver", label: "Android version"}
    ];
    $scope.filterName = $scope.noFilter;
    $scope.filterValue = $scope.noFilterValue;

    $scope.filterValues = [];


    $scope.getNextPage = function() {
        $scope.previousStartKeys.push($scope.startKey);
        $scope.startKey = $scope.nextKey;
        $scope.getData();
    }

    $scope.getPreviousPage = function() {
        $scope.nextKey = null;
        $scope.startKey = $scope.previousStartKeys.pop();
        $scope.getData();
    }

    $scope.getData = function() {
        $scope.loading = true;
        var successHandler = function(data) {
            // Success Handler
            console.log("Refresh data for latest reports");
            $scope.reports = data.rows;
            $scope.totalReports = data.total_rows;
            for(row in $scope.reports) {
                $scope.reports[row].displayDate = moment($scope.reports[row].key).fromNow();
                // TODO: Remove the signature computation when a large amount of reports have been generated with their own signature.
                $scope.reports[row].value.signature = acra.getReportSignature($scope.reports[row]);
            }

            // If there are more rows, here is the key to the next page
            $scope.nextKey =data.next_row ? data.next_row.key : null;
            $scope.startNumber = ($scope.previousStartKeys.length * $scope.reportsCount) + 1;
            $scope.endNumber = $scope.startNumber + $scope.reports.length - 1;
            console.log($scope);
            $scope.loading = false;
        };

        var errorHandler = function(response, getResponseHeaders){
                // Error Handler
                $scope.reports=[];
                $scope.totalReports="";
        };

        if($scope.filterName == $scope.noFilter || $scope.filterValue == $scope.noFilterValue) {
            ReportsStore.reportsList($scope.startKey, $scope.reportsCount, $scope.fullSearch, successHandler, errorHandler);
        } else {
            ReportsStore.filteredReportsList($scope.filterName.value, $scope.filterValue.value,$scope.startKey, $scope.reportsCount, $scope.fullSearch, successHandler, errorHandler);
        }
    }

    $scope.changeFilterValues = function() {
        console.log($scope);
        var getFilteredValues;
        if($scope.filterName.value == "androidver") {
            getFilteredValues = ReportsStore.androidVersionsList;
        } else if ($scope.filterName.value == "appver") {
            getFilteredValues = ReportsStore.appVersionsList;
        }

        if(getFilteredValues) {
            getFilteredValues(function(data){
                console.log("Update filter values");
                $scope.filterValues.length = 0;
                $scope.filterValues.push($scope.noFilterValue);
                for(row in data.rows) {
                    $scope.filterValues.push({value:data.rows[row].key[0], label:data.rows[row].key[0]});
                }
                $scope.filterValues.sort();
            });
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
            // TODO: discard this uptime computation as it is now done in the DB.
            if(!data.uptime) {
                data.uptime = (new Date(data.USER_CRASH_DATE).getTime() - new Date(data.USER_APP_START_DATE).getTime())  / 1000;
            }
            data.readableUptime = moment.duration(data.uptime, 'seconds').humanize();
            data.formatedCrashDate = moment(data.USER_CRASH_DATE).format('LLL');
            data.formatedTimestamp = moment(data.timestamp).format('LLL');
        });
    }


    $scope.$on("refresh", $scope.getData);
}
