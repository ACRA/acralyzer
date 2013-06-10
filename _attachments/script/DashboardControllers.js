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
(function(acralyzerConfig,angular,acralyzer,acralyzerEvents,$) {
    "use strict";

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

    var formatAsPercentage = d3.format("%"),
    formatAsPercentage1Dec = d3.format(".1%"),
    formatAsInteger = d3.format(","),
    fsec = d3.time.format("%S s"),
    fmin = d3.time.format("%M m"),
    fhou = d3.time.format("%H h"),
    fwee = d3.time.format("%a"),
    fdat = d3.time.format("%d d"),
    fmon = d3.time.format("%b");

    function CrashReportsCtrl($scope, ReportsStore) {
        $scope.selectedReport = "";

        $scope.getData = function() {
            ReportsStore.recentReports(function(data) {
                console.log("Refresh data for latest reports");
                $scope.reports = data.rows;
                $scope.totalReports = data.total_rows;
                for(var row = 0; row < $scope.reports.length; row++) {
                    $scope.reports[row].displayDate = moment($scope.reports[row].key).fromNow();
                }
            },
            function(response, getResponseHeaders){
                $scope.reports=[];
                $scope.totalReports="";
            });
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
                // Success callback
            });
        };

        $scope.$on(acralyzerEvents.LOGGED_IN, $scope.getData);
        $scope.$on(acralyzerEvents.APP_CHANGED, $scope.getData);
//        $scope.$on(acralyzerEvents.LOGGED_OUT, $scope.getData);
        $scope.$on(acralyzerEvents.NEW_DATA, $scope.getData);
        $scope.$on(acralyzerEvents.REPORTS_DELETED, $scope.getData);
        if($scope.acralyzer.app) {
            $scope.getData();
        }
    }

    function BugsCtrl($scope, ReportsStore, $filter) {
        $scope.selectedBug = "";
        $scope.bugsLimit = 10;
        $scope.hideSolvedBugs = true;
        $scope.bugs = [];

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
            ReportsStore.bugsList(function(data) {
                    console.log("Refresh data for latest bugs");
                    mergeBugsLists($scope.bugs, data.rows);
                    $scope.totalBugs = data.total_rows;
                    for(var row = 0; row < $scope.bugs.length; row++) {
                        $scope.bugs[row].latest = moment($scope.bugs[row].value.latest).fromNow();
                    }
                },
                function(response, getResponseHeaders){
                    $scope.bugs=[];
                    $scope.totalBugs="";
                });
        };

        $scope.shouldBeDisplayed = function(bug) {
            if($scope.hideSolvedBugs && bug.value.solved) {
                return false;
            } else {
                return true;
            }
        };

        $scope.pageItems = function() {
            var filtFilter = $filter("filter"); // First remove unnecessary items
            var filtOrderBy = $filter("orderBy"); // Order by latest occurence
            var filtLimitTo = $filter("limitTo"); // Limit to X items

            return filtLimitTo(
                filtOrderBy(
                    filtFilter(
                        $scope.bugs, $scope.shouldBeDisplayed
                    ), 'value.latest', true
                ), $scope.bugsLimit
            );
        };

        $scope.$on(acralyzerEvents.LOGGED_IN, $scope.getData);
        $scope.$on(acralyzerEvents.APP_CHANGED, $scope.getData);
        $scope.$on(acralyzerEvents.NEW_DATA, $scope.getData);
        $scope.$on(acralyzerEvents.BUGS_UPDATED, $scope.getData);
        if($scope.acralyzer.app) {
            $scope.getData();
        }
    }


    function ReportsPerDayCtrl($scope, ReportsStore, $user) {
        $scope.periods = [
            {name: "Year", value: 1},
            {name: "Month", value: 2},
            {name: "Day", value: 3},
            {name: "Hour", value: 4},
            {name: "Minute", value: 5},
            {name: "Second", value: 6}
        ];
        $scope.period = $scope.periods[2];

        $scope.reportsPerDay=[];

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
            if ($user.isReader()) {
                ReportsStore.reportsPerDay(
                    $scope.period.value,
                    function(data) {
                        $scope.reportsPerDay = getBidimensionalArray(data.rows);
                        $scope.updateGraph();
                    },
                    function(response, getResonseHeaders){
                        $scope.reportsPerDay=[[]];
                        $scope.updateGraph();
                    }
                );
            }
        };


        $scope.buildGraph = function () {
            var container = $("#graph-container");
            $scope.metrics = {
                /*
                width : parseInt(container.style.width),
                height : parseInt(container.style.height),
                */
                width : container.width(),
                height : container.height() * 0.8,
                padding : container.height() * 0.15
            };

            // create an svg container
            if(!$scope.vis) {
                $scope.vis =  d3.select("#graph-container")
                .append("svg:svg")
                .attr("width", "100%")
                .attr("height", "80%")
                .attr("viewBox", "0 0 " + $scope.metrics.width + " " + $scope.metrics.height)
                .attr("preserveAspectRatio", "xMidYMid meet");
                /*
                .attr("width", $scope.metrics.width)
                .attr("height", $scope.metrics.height);
                */
            }


            $scope.xScale = d3.time.scale()
                .domain([d3.min($scope.reportsPerDay, $scope.dataDate), new Date()])
                .range([$scope.metrics.padding, $scope.metrics.width - $scope.metrics.padding]);   // map these the the chart width = total width minus padding at both sides


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

        };


        $scope.updateGraph = function updateGraph() {

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
            .attr("y", function(d){return $scope.yScale(0);})
            .transition().delay(375).duration(1)
            .attr("x", function(d){return $scope.xScale($scope.dataDate(d));})
            .transition().delay(376).duration(374)
            .attr("y", function(d){return $scope.yScale($scope.dataValue(d));})
            .attr("height", function(d) { return $scope.metrics.height - $scope.metrics.padding - $scope.yScale($scope.dataValue(d));});

            bars.enter().append("rect")
            .attr("class","enter")
            .attr("x", function(d){return $scope.xScale($scope.dataDate(d));})
            .attr("y", function(d){return $scope.yScale(0);})
            .attr("height", 0)
            .transition().duration(750)
            .attr("x", function(d){return $scope.xScale($scope.dataDate(d));})
            .attr("y", function(d){return $scope.yScale($scope.dataValue(d));})
            .attr("width", 1)
            .attr("height", function(d) { return $scope.metrics.height - $scope.metrics.padding - $scope.yScale($scope.dataValue(d)); });

            bars.exit()
            .attr("class","exit")
            .transition().duration(750)
            .attr("height", 0)
            .attr("y", function(d){return $scope.yScale(0);})
            .remove();
        };

        $scope.buildGraph();

        $scope.$on(acralyzerEvents.LOGGED_IN, $scope.getData);
        $scope.$on(acralyzerEvents.APP_CHANGED, $scope.getData);
//        $scope.$on(acralyzerEvents.LOGGED_OUT, $scope.getData);
        $scope.$on(acralyzerEvents.NEW_DATA, $scope.getData);
        $scope.$on(acralyzerEvents.REPORTS_DELETED, $scope.getData);
        if($scope.acralyzer.app) {
            $scope.getData();
        }
    }

    /* Pie charts */
    function PieChartsCtrl($scope, ReportsStore, $user) {
        $scope.fieldNames = [
            {name: "android-version", label: "Android version"},
            {name: "android-sdk-version", label: "Android SDK version"},
            {name: "app-version-name", label: "Application version name"},
            {name: "app-version-code", label: "Application version code"},
            {name: "device", label: "Device"}
        ];
        $scope.fieldName = $scope.fieldNames[0];

        $scope.reportsPerFieldName=[];

        $scope.getData = function() {
            if ($user.isReader()) {
                ReportsStore.reportsPerFieldName(
                    $scope.fieldName.name,
                    function(data) {
                        $scope.reportsPerFieldName = getBidimensionalArray(data.rows);
                        var totalReports = 0;
                        var i = 0;
                        // Get total number of reports before calculating the ratio for each value.
                        for(i = 0; i < $scope.reportsPerFieldName.length; i++) {
                            totalReports += $scope.reportsPerFieldName[i][1];
                        }
                        for(i = 0; i < $scope.reportsPerFieldName.length; i++) {
                            $scope.reportsPerFieldName[i][2] = $scope.reportsPerFieldName[i][1] / totalReports;
                        }
                        $scope.updateGraph();
                    },
                    function(response, getResonseHeaders){
                        $scope.reportsPerFieldName=[[]];
                        $scope.updateGraph();
                    }
                );
            }
        };

        $scope.mouseover = function() {
            d3.select(this).select("path").transition()
            .duration(350)
            //.attr("stroke","red")
            //.attr("stroke-width", 1.5)
            .attr("d", $scope.arcFinal3)
            ;
        };

        $scope.mouseout = function() {
            d3.select(this).select("path").transition()
            .duration(350)
            //.attr("stroke","blue")
            //.attr("stroke-width", 1.5)
            .attr("d", $scope.arcFinal)
            ;
        };

        $scope.up = function(d, i) {
            /* update bar chart when user selects piece of the pie chart */
            //updateBarChart(dataset[i].category);
            //            updateBarChart(d.data.category, color(i));
            //            updateLineChart(d.data.category, color(i));

        };

        $scope.buildGraph = function () {
            var container = $("#pie-charts");

            var outerRad =  Math.min(container.width(), container.height()) / 2;
            var innerRad = outerRad * 0.999;
            $scope.metrics = {
                width : container.width(),
                height : container.height(),
                padding : container.height() * 0.15,
                outerRadius : outerRad,
                outerRadiusSelected : outerRad * 1.05,
                innerRadius : innerRad,
                // for animation
                innerRadiusFinal : outerRad * 0.2,
                innerRadiusFinal3 : outerRad * 0.25,
                color : d3.scale.category20()    //builtin range of colors
            };

            // create an svg container
            $scope.vis =  d3.select("#pie-charts")
            .append("svg:svg")              //create the SVG element inside the <body>
            .data([$scope.reportsPerFieldName])                   //associate our data with the document
            .attr("width", "95%")
            .attr("height", "85%")
            .attr("viewBox", "0 0 " + $scope.metrics.width + " " + $scope.metrics.height)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("svg:g")                //make a group to hold our pie chart
            .attr("transform", "translate(" + $scope.metrics.width / 2 + "," + $scope.metrics.height / 2 + ")")    //move the center of the pie chart from 0, 0 to radius, radius
            ;

            $scope.arc = d3.svg.arc()              //this will create <path> elements for us using arc data
            .outerRadius($scope.metrics.outerRadius).innerRadius($scope.metrics.innerRadius);

            // for animation
            $scope.arcFinal = d3.svg.arc().innerRadius($scope.metrics.innerRadiusFinal).outerRadius($scope.metrics.outerRadius);
            $scope.arcFinal3 = d3.svg.arc().innerRadius($scope.metrics.innerRadiusFinal3).outerRadius($scope.metrics.outerRadiusSelected);

            $scope.pie = d3.layout.pie()            //this will create arc data for us given a list of values
            .value(function(d) {
                return d[2];
            });    //we must tell it how to access the value of each element in our data array

            // Computes the label angle of an arc, converting from radians to degrees.
            $scope.angle = function(d) {
                var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
                return a > 90 ? a - 180 : a;
            }

            // Pie chart title
            /*        $scope.chartTitle = $scope.vis.append("svg:text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text($scope.fieldName.label)
            .attr("class","title")
            */        ;

        };

        $scope.updateGraph = function () {
            $scope.vis.data([$scope.reportsPerFieldName]);
            //        $scope.chartTitle.text($scope.fieldName.label);

            var arcs = $scope.vis.selectAll("g.slice").data($scope.pie);

            // update
            arcs.select("path").attr("d", $scope.arcFinal);

            arcs.select(".pie-label").remove();

            arcs.filter(function(d) { return d.endAngle - d.startAngle > 0.2; })
            .append("svg:text")
            .attr("class", "pie-label")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) { return "translate(" + $scope.arcFinal.centroid(d) + ")rotate(" + $scope.angle(d) + ")"; })
            .text(function(d) { return d.data[0] + " : " + formatAsPercentage(d.value); })
            ;

            arcs.select("title")
            .text(function(d) { return d.data[0] + " : " + formatAsPercentage(d.value) + " (" + d.data[1] + " reports)"; });

            arcs.exit().remove();

            var newarcs = arcs.enter()
            .append("svg:g")
            .attr("class", "slice")
            .on("mouseover", $scope.mouseover)
            .on("mouseout", $scope.mouseout)
            .on("click", $scope.up);

            newarcs.append("svg:path")
            .attr("fill", function(d, i) { return $scope.metrics.color(i); } ) //set the color for each slice to be chosen from the color function defined above
            .attr("d", $scope.arcFinal)     //this creates the actual SVG path using the associated data (pie) with the arc drawing function
            .append("svg:title") //mouseover title showing the figures
            .text(function(d) { return d.data[0] + " : " + formatAsPercentage(d.value) + " (" + d.data[1] + " reports)"; })
            ;

            newarcs.filter(function(d) { return d.endAngle - d.startAngle > 0.2; })
            .append("svg:text")
            .attr("class", "pie-label")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) { return "translate(" + $scope.arcFinal.centroid(d) + ")rotate(" + $scope.angle(d) + ")"; })
            .text(function(d) { return d.data[0] + " : " + formatAsPercentage(d.value); })
            ;


            /*        d3.selectAll("g.slice").selectAll("path").transition()
            .duration(750)
            .delay(10)
            .attr("d", $scope.arcFinal )
            ;
            */
        };

        $scope.buildGraph();

        $scope.$on(acralyzerEvents.LOGGED_IN, $scope.getData);
        $scope.$on(acralyzerEvents.APP_CHANGED, $scope.getData);
//        $scope.$on(acralyzerEvents.LOGGED_OUT, $scope.getData);
        $scope.$on(acralyzerEvents.NEW_DATA, $scope.getData);
        $scope.$on(acralyzerEvents.REPORTS_DELETED, $scope.getData);
        if($scope.acralyzer.app) {
            $scope.getData();
        }
    }

    function DashboardCtrl($scope, $routeParams) {
        if($routeParams.app) {
            console.log("Dashboard: Direct access to app " + $routeParams.app);
            $scope.acralyzer.setApp($routeParams.app);
        }
    }

    acralyzer.controller('ReportsPerDayCtrl', [ "$scope", "ReportsStore", "$user", ReportsPerDayCtrl]);
    acralyzer.controller('PieChartsCtrl', ["$scope", "ReportsStore", "$user", PieChartsCtrl]);
    acralyzer.controller('DashboardCtrl', ["$scope", "$routeParams", DashboardCtrl]);
    acralyzer.controller('CrashReportsCtrl', ["$scope", "ReportsStore", CrashReportsCtrl]);
    acralyzer.controller('BugsCtrl', ["$scope", "ReportsStore", "$filter", BugsCtrl]);

})(window.acralyzerConfig,window.angular,window.acralyzer,window.acralyzerEvents,window.jQuery);
