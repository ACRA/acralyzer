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
    $scope.getData = function() {
        $.couch.session({
            success: function(session) {
                console.log(session);
                if(session.userCtx.roles.indexOf("reader") >= 0 || session.userCtx.roles.indexOf("_admin") >= 0) {
                    console.log("You are authorized as a reader!");
                    ReportsStore.reportsPerDay(3, function(data) {
                        $scope.reportsPerDay= getBidimensionalArray(data.rows);
                        buildGraph($scope);
                    });
                }
            }
        });
    }
}

function buildGraph($scope) {

    var width = 800,
        height = 400,
        padding = 100;
            
    // create an svg container
    var vis = d3.select("#graph-container")
    	.append("svg:svg")
        .attr("width", width)
        .attr("height", height);
    var dataDate = function(d) {
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
    var dataValue = function(d) {
    	return d[1];
    };
 

   var xScale = d3.time.scale()
        .domain([d3.min($scope.reportsPerDay, dataDate), new Date()])
		.range([padding, width - padding * 2]);   // map these the the chart width = total width minus padding at both sides
	    

    // define the y scale  (vertical)
    var yScale = d3.scale.linear()
        .domain([0, d3.max($scope.reportsPerDay, dataValue)])
   		.range([height - padding, padding]);   // map these to the chart height, less padding.  
             //REMEMBER: y axis range has the bigger number first because the y value of zero is at the top of chart and increases as you go down.
        
 
    // define the y axis
    var yAxis = d3.svg.axis()
        .orient("left")
        .scale(yScale);
    
    // define the y axis
    var xAxis = d3.svg.axis()
        .orient("bottom")
        .scale(xScale);
        
    // draw y axis with labels and move in from the size by the amount of padding
    vis.append("g")
        .attr("class", "yaxis")   // give it a class so it can be used to select only xaxis labels  below
        .attr("transform", "translate("+padding+",0)")
        .call(yAxis);

    // draw x axis with labels and move to the bottom of the chart area
    vis.append("g")
        .attr("class", "xaxis")   // give it a class so it can be used to select only xaxis labels  below
        .attr("transform", "translate(0," + (height - padding) + ")")
        .call(xAxis);
        
    // now rotate text on x axis
    // solution based on idea here: https://groups.google.com/forum/?fromgroups#!topic/d3-js/heOBPQF3sAY
    // first move the text left so no longer centered on the tick
    // then rotate up to get 45 degrees.
   vis.selectAll(".xaxis text")  // select all the text elements for the xaxis
      .attr("transform", function(d) {
          return "translate(" + this.getBBox().height*-2 + "," + this.getBBox().height + ")rotate(-45)";
    });

    // Insert data
    vis.selectAll("rect")
     .data($scope.reportsPerDay)
   .enter().append("rect")
     .attr("x", function(d){return xScale(dataDate(d))})
     .attr("y", function(d){return yScale(dataValue(d))})
     .attr("width", 1)
     .attr("height", function(d) { return height - padding - yScale(dataValue(d)) });
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


