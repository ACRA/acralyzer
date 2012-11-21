angular.module('Acralyzer', ['acra-storage']);


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
     
}( window.acra = window.acra || {}, jQuery ));
 

function CrashReportsCtrl($scope, ReportsStore) {
    console.log(ReportsStore);

    $scope.getData = function() {
        ReportsStore.recentReports(function(data) {
            $scope.reports = data.rows;
            for(row in $scope.reports) {
                console.log(row);
                row.link = acra.getDocUrl(row._id);
            }
        });
    }

}


function ReportsPerDayCtrl($scope, ReportsStore) {
    $scope.periods = [
      {name: "Year", value: 1},
      {name: "Month", value: 2},
      {name: "Day", value: 3},
      {name: "Hour", value: 4},
      {name: "Minute", value: 5},
      {name: "Second", value: 6},
    ];
    $scope.period = $scope.periods[2];
    
    $scope.reportsPerDay=[];
    buildGraph($scope);

    $scope.dataDate = function(d) {
        var result = new Date();
        var dateArray = d[0];
        if(dateArray[0]) {
            result.setFullYear(dateArray[0]);
        } else {
            result.setFullYear(0);
        }
        if(dateArray[1]) {
            result.setMonth(dateArray[1]);
        } else {
            result.setMonth(0);
        }
        if(dateArray[2]) {
            result.setDate(dateArray[2]);
        } else {
            result.setDate(0);
        }
        if(dateArray[3]) {
            result.setHours(dateArray[3]);
        } else {
            result.setHours(0);
        }
        if(dateArray[4]) {
            result.setMinutes(dateArray[4]);
        } else {
            result.setMinutes(0);
        }
        if(dateArray[5]) {
            result.setSeconds(dateArray[5]);
        } else {
            result.setSeconds(0);
        }
        if(dateArray[6]) {
            result.setMilliseconds(dateArray[6]);
        } else {
            result.setMilliseconds(0);
        }
        return result;
    };
    $scope.dataValue = function(d) {
        return d[1];
    };


    $scope.getData = function() {
        $.couch.session({
            success: function(session) {
                console.log(session);
                if(session.userCtx.roles.indexOf("reader") >= 0 || session.userCtx.roles.indexOf("_admin") >= 0) {
                    console.log("You are authorized as a reader!");
                    ReportsStore.reportsPerDay($scope.period.value, function(data) {
                        $scope.reportsPerDay= getBidimensionalArray(data.rows);
                        updateGraph($scope);
                    });
                }
            }
        });
    }

}

function updateGraph($scope) {

    $scope.xScale.domain([d3.min($scope.reportsPerDay, $scope.dataDate), new Date()]);
    $scope.yScale.domain([0, d3.max($scope.reportsPerDay, $scope.dataValue)]);
    $scope.vis.select(".xaxis")
        .transition().duration(750)
        .call($scope.xAxis);
    $scope.vis.select(".yaxis")
        .transition().duration(750)
        .call($scope.yAxis);

    // now rotate text on x axis
    // solution based on idea here: https://groups.google.com/forum/?fromgroups#!topic/d3-js/heOBPQF3sAY
    // first move the text left so no longer centered on the tick
    // then rotate up to get 45 degrees.
   $scope.vis.selectAll(".xaxis text")  // select all the text elements for the xaxis
      .attr("transform", function(d) {
          return "translate(" + this.getBBox().height*-2 + "," + this.getBBox().height + ")rotate(-45)";
    });

    // Update data
    var bars = $scope.vis.selectAll("rect")
     .data($scope.reportsPerDay);
    bars.attr("class", "update")
      .transition().duration(375)
       .attr("height", 0)
       .attr("y", function(d){return $scope.yScale(0)})
      .transition().delay(375).duration(1)
       .attr("x", function(d){return $scope.xScale($scope.dataDate(d))})
      .transition().delay(376).duration(374)
       .attr("y", function(d){return $scope.yScale($scope.dataValue(d))})
       .attr("height", function(d) { return $scope.metrics.height - $scope.metrics.padding - $scope.yScale($scope.dataValue(d)) });

    bars.enter().append("rect")
      .attr("class","enter")
      .attr("x", function(d){return $scope.xScale($scope.dataDate(d))})
      .attr("y", function(d){return $scope.yScale(0)})
      .attr("height", 0)
      .transition().duration(750)
      .attr("x", function(d){return $scope.xScale($scope.dataDate(d))})
      .attr("y", function(d){return $scope.yScale($scope.dataValue(d))})
      .attr("width", 1)
      .attr("height", function(d) { return $scope.metrics.height - $scope.metrics.padding - $scope.yScale($scope.dataValue(d)) });

     bars.exit()
       .attr("class","exit")
       .transition().duration(750)
       .attr("height", 0)
       .attr("y", function(d){return $scope.yScale(0)})
       .remove();
}

function buildGraph($scope) {

    $scope.metrics = { width : 800,
        height : 400,
        padding : 100};
            
    // create an svg container
    if(!$scope.vis) {
        $scope.vis = d3.select("#graph-container")
        	.append("svg:svg")
            .attr("width", $scope.metrics.width)
            .attr("height", $scope.metrics.height);
    }
 

    $scope.xScale = d3.time.scale()
        .domain([d3.min($scope.reportsPerDay, $scope.dataDate), new Date()])
		.range([$scope.metrics.padding, $scope.metrics.width - $scope.metrics.padding * 2]);   // map these the the chart width = total width minus padding at both sides
	    

    // define the y scale  (vertical)
    $scope.yScale = d3.scale.linear()
        .domain([0, d3.max($scope.reportsPerDay, $scope.dataValue)])
   		.range([$scope.metrics.height - $scope.metrics.padding, $scope.metrics.padding]);   // map these to the chart height, less padding.  
             //REMEMBER: y axis range has the bigger number first because the y value of zero is at the top of chart and increases as you go down.
        
 
    // define the y axis
    $scope.yAxis = d3.svg.axis()
        .orient("left")
        .scale($scope.yScale);
    
    // define the y axis
    $scope.xAxis = d3.svg.axis()
        .orient("bottom")
        .scale($scope.xScale);
        
    // draw y axis with labels and move in from the size by the amount of padding
    $scope.vis.append("g")
        .attr("class", "yaxis")   // give it a class so it can be used to select only xaxis labels  below
        .attr("transform", "translate("+$scope.metrics.padding+",0)")
        .call($scope.yAxis);

    // draw x axis with labels and move to the bottom of the chart area
    $scope.vis.append("g")
        .attr("class", "xaxis")   // give it a class so it can be used to select only xaxis labels  below
        .attr("transform", "translate(0," + ($scope.metrics.height - $scope.metrics.padding) + ")")
        .call($scope.xAxis);
        
}

function getBidimensionalArray(rows) {
	var result = new Array(rows.length);
	for(var i = 0; i < rows.length; i++) {
		var row = rows[i];
		if(row.key && row.value) {
			result[i] = [row.key, row.value];
		}
	}
	return result;
}


