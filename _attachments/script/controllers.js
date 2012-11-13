function getViewUrl(view,options) {
	var path = unescape(document.location.pathname).split('/'),
		dbname = "acra-storage",
        design = path[3];
        var result = "/" + dbname + "/_design/" + design + "/_view/" + view;
        if (options) {
        	result += "?" + options;
        }
        return result;
}


function CrashReportsCtrl($scope, $http) {
//	console.log($scope);
	/*var path = unescape(document.location.pathname).split('/'),
		dbname = path[1],
        design = path[3],
        db = $.couch.db(path[1]);
    db.view(design + "/recent-items", {
        descending : "true",
        limit : 50,
        update_seq : true,
        success : function(data) {
        	console.log($scope);
        	console.log(data);
			$scope.reports = data.rows.map(function(r) {return r.value;}).makeArray();
			console.log($scope.reports);
        }
    });*/

    $http.get(getViewUrl("recent-items")).success(function(data){
    	$scope.reports = data.rows;
    });

/*    $scope.reports = [
    	{
    		android_version: 4.1,
			stack_trace: "java.lang.Exception: This is a silent report!↵	at org.acra.sampleapp.CrashTestLauncher$2.onClick(CrashTestLauncher.java:44)↵	at android.view.View.performClick(View.java:4084)↵	at android.view.View$PerformClick.run(View.java:16966)↵	at android.os.Handler.handleCallback(Handler.java:615)↵	at android.os.Handler.dispatchMessage(Handler.java:92)↵	at android.os.Looper.loop(Looper.java:137)↵	at android.app.ActivityThread.main(ActivityThread.java:4745)↵	at java.lang.reflect.Method.invokeNative(Native Method)↵	at java.lang.reflect.Method.invoke(Method.java:511)↵	at com.android.internal.os.ZygoteInit$MethodAndArgsCaller.run(ZygoteInit.java:786)↵	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:553)↵	at dalvik.system.NativeStart.main(Native Method)↵",
			user_crash_date: "2012-11-02T00:05:05.000+00:00"
		}
    ];
*/}

function ReportsPerDayCtrl($scope, $http) {
    $.couch.session({
        success: function(session) {
            console.log(session);
            if(session.userCtx.roles.indexOf("reader") >= 0 || session.userCtx.roles.indexOf("_admin") >= 0) {
                console.log("You are authorized as a reader!");
                $http.get(getViewUrl("reports-per-day","group=true")).success(function(data){
                    $scope.reportsPerDay = getBidimensionalArray(data.rows);
                    buildGraph($scope);
                });
            }
        }
    })
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
        result.setFullYear(d[0][0],d[0][1],d[0][2]);
        result.setHours(0);
        result.setMinutes(0);
        result.setSeconds(0);
        result.setMilliseconds(0);
        console.log(result);
        return result;
   	};
    var dataValue = function(d) {
    	return d[1];
    };
 

   var xScale = d3.time.scale()
        .domain([d3.min($scope.reportsPerDay, dataDate), d3.max($scope.reportsPerDay, dataDate)])
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

function getXYArray(rows) {
    var result = new Array(rows.length);
    for(var i=0; i < rows.length; i++) {
        var row = rows[i];
        var reportDate = new Date();
        reportDate.setUTCFullYear(row.key[0],row.key[1],row.key[2]);
        result[i] = { x: reportDate.getTime(), y:row.value};
    }
    return result;
}

function RickshawCtrl($scope, $http) {
    $.couch.session({
        success: function(session) {
            console.log(session);
            if(session.userCtx.roles.indexOf("reader") >= 0 || session.userCtx.roles.indexOf("_admin") >= 0) {
                console.log("You are authorized as a reader!");
                $http.get(getViewUrl("reports-per-day","group=true")).success(function(data){
                    $scope.reportsPerDay = getXYArray(data.rows);
                    buildRickshaw($scope);
                });
            }
        }
    })
}

function buildRickshaw($scope) {
    console.log($scope);
    var graph = new Rickshaw.Graph( {
        element: document.querySelector("#rickshaw-container"),
        width: 700,
        height: 200,
        renderer: 'bar',
        series: [ {
            data: $scope.reportsPerDay,
            color: 'steelblue'
        } ]
    } );
    var axes = new Rickshaw.Graph.Axis.Time( { graph: graph } );
    graph.render();
}
