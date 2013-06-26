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

(function(acralyzer, MonsterId) {
    "use strict";

    acralyzer.directive("monsterid", function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                scope.element = element;
                var drawMonster = function(monsterId) {
                    MonsterId.getAvatar(monsterId, element[0]);
                };

                scope.$watch('element[0].offsetWidth + element[0].offsetHeight', function(newValue, oldValue){
                    drawMonster(attrs.monsterid);
                });
                scope.$watch(function() {
                    return attrs.monsterid;
                }, function(newValue, oldValue){
                    drawMonster(attrs.monsterid);
                });
                drawMonster(attrs.monsterid);
            }
        };
    });
})(window.acralyzer, window.MonsterId);