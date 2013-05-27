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

(function(acralyzerEvents) {
    "use strict";
    acralyzerEvents.NEW_DATA = "new_data";
    acralyzerEvents.REPORTS_DELETED = "reports_deleted";
    acralyzerEvents.BUGS_UPDATED = "bugs_updated";
    acralyzerEvents.LOGIN_CHANGE = "login_change";
    acralyzerEvents.LOGGED_IN = "logged_in";
    acralyzerEvents.LOGGED_OUT = "logged_out";
    acralyzerEvents.POLLING_FAILED = "polling failed";
    acralyzerEvents.APP_CHANGED = "app changed";
    acralyzerEvents.USER_PASSWORD_CHANGE = "password_change";

}( window.acralyzerEvents = window.acralyzerEvents || {}));
