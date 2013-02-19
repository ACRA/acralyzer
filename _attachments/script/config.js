(function(acralyzerConfig, $, undefined ) {
    // Update this variable with the name of your app:
    acralyzerConfig.defaultApp = "storage";
    acralyzerConfig.backgroundPollingOnStartup = true;

    acralyzerConfig.appDBPrefix = "acra-";

    // Helper functions
    // TODO: Remove the signature computation when a large amount of reports have been generated with their own signature.
    acralyzerConfig.getReportSignature = function(report) {
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

}( window.acralyzerConfig = window.acralyzerConfig || {}, jQuery ));