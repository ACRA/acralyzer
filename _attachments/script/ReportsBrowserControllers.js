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

    $scope.appVersions = [];
    $scope.androidVersions = [];


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
        $scope.updateAppVersions();
        $scope.updateAndroidVersions();
        ReportsStore.reportsList($scope.startKey, $scope.reportsCount, $scope.fullSearch, function(data) {
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
            },
            function(response, getResponseHeaders){
                // Error Handler
                $scope.reports=[];
                $scope.totalReports="";
            });
    }

    $scope.updateAppVersions = function() {
        ReportsStore.appVersionsList(function(data){
           console.log("Update application versions");
            $scope.appVersions.length = 0;
            for(row in data.rows) {
                $scope.appVersions.push(data.rows[row].key[0]);
            }
            $scope.appVersions.sort();
        });
    }

    $scope.updateAndroidVersions = function() {
        ReportsStore.androidVersionsList(function(data){
            console.log("Update android versions");
            $scope.androidVersions.length = 0;
            for(row in data.rows) {
                $scope.androidVersions.push(data.rows[row].key[0]);
            }
            $scope.androidVersions.sort();
        });
    }

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


    $scope.getData();
    $scope.$on("refresh", $scope.getData);
}
