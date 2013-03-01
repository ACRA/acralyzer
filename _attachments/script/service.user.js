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
(function(acralyzerConfig,acralyzer,acralyzerEvents,$) {
    "use strict";
    /**
    * Couchdb user service
    *
    * @class user
    * @singleton
    * @static
    */
    acralyzer.service('$user', ['$rootScope', '$q', function($rootScope, $q) {
        var ret = this;

        ret.hasAdminPath = undefined;
        /**
        * Resets the user object back to the default state
        * @method reset
        */
        ret.reset = function() {
            /** 
             * Username of current logged in user
             *
             * @property {String} username
             * @type String
             * @readOnly
             */
            ret.username = null;
            /**
             * Is current user an admin
             *
             * @property {Boolean} isAdmin
             * @type Boolean
             * @readOnly
             */
            ret.isAdmin = false;
            /**
             * Current users roles (as object)
             *
             * @property {Object} roles
             * @type Object
             * @readOnly
             */
            ret.roles = {};
        };
        ret.reset();
        /**
         * Updates the session of the current user 
         *
         * @private
         * @method updateSession
         * @param {Promise} deferred Promise to update when completed
         */
        ret.updateSession = function(deferred) {
            $.couch.session({
                success : function(session) {
                    var userCtx = session.userCtx;
                    ret.roles = {};
                    userCtx.roles.forEach(function(role) {
                        ret.roles[role] = 1;
                    });
                    ret.isAdmin = (ret.roles['_admin'] === 1);
                    ret.username = userCtx.name;
                    $rootScope.$broadcast(acralyzerEvents.LOGGED_IN, ret);
                    $rootScope.$broadcast(acralyzerEvents.LOGIN_CHANGE, ret);
                    if (ret.username && ret.isAdmin && ret.hasAdminPath === undefined )
                    {
                        $.ajax({
                            type: "GET",
                            url: $.couch.urlPrefix + "/_config/admins/" + ret.username,
                            beforeSend: function(xhr) {
                                xhr.setRequestHeader('Accept', 'application/json');
                            },
                            complete: function(req) {
                                var resp = $.parseJSON(req.responseText);
                                if (req.status === 200 && resp.match(/^-hashed-/)) {
                                    ret.hasAdminPath = true;
                                } else {
                                    ret.hasAdminPath = false;
                                }
                            }
                        });
                    }
                    if (deferred) {
                        deferred.resolve(ret);
                        $rootScope.$apply();
                    }
                },
                error: function(data) {
                    if (deferred) {
                        deferred.reject(data.reason);
                        $rootScope.$apply();
                    }
                }
            });
        };

        /**
        * Logs in the user.
        *
        * @method login
        * @param {String} username Username to log in with
        * @param {String} password Password to log in username with
        *
        * @return {Promise} Promise for completion of login
        */

        ret.login = function(username, password) {
            var deferred = $q.defer();

            var options = {
                name: username,
                password: password,
                success: function(data) {
                    /* Grab user session after login */
                    ret.updateSession(deferred);
                },
                error: function(data) {
                    deferred.reject(data.reason);
                    $rootScope.$apply();
                }
            };
            $.couch.login(options);

            return deferred.promise;
        };

        /**
        * Changes the password of the currently logged in user
        *
        * Side effect: logs out user
        *
        * @method changePassword
        * @param {String} password New Password for the user
        *
        * @return {Promise} Promise for completion of change password
        */
        ret.changePassword = function(password) {
            var deferred = $q.defer();
            if (!password) {
                deferred.reject("Missing password");
                return deferred.promise;
            }
            if (ret.isAdmin && ret.hasAdminPath === true) {
                $.ajax({
                    type: "PUT",
                    url: $.couch.urlPrefix + "/_config/admins/" + ret.username,
                    data: '"' + password + '"',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('Accept', 'application/json');
                    },
                    complete: function(req) {
                        var resp = $.parseJSON(req.responseText);
                        if (req.status === 200) {
                            /* Once we update the password, our current session is expired */
                            /* Tried re-logging in, but there's a race condition here that is hard to track
                             * So easiest just to log the user out */
                            ret.logout().then(function() {
                                deferred.resolve();
                            });
                        } else {
                            deferred.reject(resp.reason);
                            $rootScope.$apply();
                        }
                    }
                });
                return deferred.promise;
            }
            $.couch.userDb(function(db) {
                var userDocId = "org.couchdb.user:"+ret.username;
                db.openDoc(userDocId, {
                    success : function(userDoc) {
                        userDoc.password = password;
                        db.saveDoc(userDoc, {
                            success : function() {
                                $rootScope.$broadcast(acralyzerEvents.USER_PASSWORD_CHANGE, ret);
                                $rootScope.$broadcast(acralyzerEvents.LOGIN_CHANGE, ret);
                                ret.logout().then(function() {
                                    deferred.resolve();
                                });
                            },
                            error: function(data) {
                                deferred.reject(data.missing);
                                $rootScope.$apply();
                            }
                        });
                    },
                    error: function() {
                        deferred.reject(ret);
                        $rootScope.$apply();
                    }
                });
            });
            return deferred.promise;
        };

        /**
        * Logout the current user
        *
        * @method logout
        * @return {Promise} Promise for completion of logout
        */
        ret.logout = function() {
            var deferred = $q.defer();

            $.couch.logout({
                success: function(data) {
                    ret.reset();
                    $rootScope.$broadcast(acralyzerEvents.LOGGED_OUT, ret);
                    $rootScope.$broadcast(acralyzerEvents.LOGIN_CHANGE, ret);
                    deferred.resolve(ret);
                    $rootScope.$apply();
                },
                error: function(data) {
                    deferred.resolve(ret);
                    $rootScope.$apply();
                }
            });
            return deferred.promise;
        };

        /* First time we grab our session from couchdb */
        ret.updateSession();
        return ret;
    }]);

})(window.acralyzerConfig, window.acralyzer, window.acralyzerEvents, window.jQuery);
