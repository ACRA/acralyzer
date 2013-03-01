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
(function(acralyzerConfig,acralyzer,$) {
    "use strict";

    acralyzer.factory('$notify', ['$timeout', function($timeout) {
        var ret = {};
        ret._alerts = [
        ];

        var desktopNotifyAllowed, desktopNotifyObject;
        /* data is an object with 'title', 'body' and optional 'icon' keys */
        if ("Notification" in window && window.Notification.permissionLevel) {
            desktopNotifyAllowed = function() { return window.Notification.permissionLevel() === "granted"; };
            desktopNotifyObject = function(data) { return new window.Notification(data.title, data); };
        }
        else if (window.webkitNotifications) {
            /* 0 = allowed, 1 = not allowed, 2 = denied */
            desktopNotifyAllowed = function() { return window.webkitNotifications.checkPermission() === 0; };
            desktopNotifyObject = function(data) { return new window.Notification(data.title, data); };
        }

        ret.desktop = function(data) {
            if (!desktopNotifyAllowed()) { return; }

            var timeout = data.timeout;
            var notif = desktopNotifyObject(data);
            /* undefined == not passed in */
            if (timeout === undefined) { timeout = 10000; }
            if (timeout > 0) {
                notif.onshow = function() {
                    setTimeout(function(){
                        notif.close();
                    }, timeout);
                };
            }
            notif.show();
        };

        ['fatal','info','error','success','warning'].forEach(function(key) {
            ret[key] = function(data) {
                if (data.desktop) {
                    ret.desktop(data);
                }
                var alert = { type: key, msg: data.body };
                ret._alerts.push(alert);
                if (data.timeout > 0) {
                    $timeout(function() {
                        var index = ret._alerts.indexOf(alert);
                        ret._alerts.splice(index,1);
                    },data.timeout);
                }
            };
        });

        ret.remove = function(index) {
            ret._alerts.splice(index,1);
        };

        return ret;

    }]);
})(window.acralyzerConfig,window.acralyzer, window.jQuery);
