function CrashReportsBrowserCtrl($scope, ReportsStore) {
    $scope.selectedReport = "";

    $scope.getData = function() {
        ReportsStore.reportsList(function(data) {
                console.log("Refresh data for latest reports");
                $scope.reports = data.rows;
                $scope.totalReports = data.total_rows;
                for(row in $scope.reports) {
                    $scope.reports[row].displayDate = moment($scope.reports[row].key).fromNow();
                    // TODO: Remove the signature computation when a large amount of reports have been generated with their own signature.
                    $scope.reports[row].value.signature = acra.getReportSignature($scope.reports[row]);
                }
            },
            function(response, getResponseHeaders){
                $scope.reports=[];
                $scope.totalReports="";
            });
    }

    $scope.loadReport = function(report) {
        $scope.selectedReport = ReportsStore.reportDetails(report.id);
        console.log($scope.selectedReport);
    }

    $scope.getData();
    $scope.$on("refresh", $scope.getData);
}
