// Copyright Chris Anderson 2011
// Apache 2.0 License
// jquery.couchLogin.js
// 
// Example Usage (loggedIn and loggedOut callbacks are optional): 
//    $("#mylogindiv").couchLogin({
//        loggedIn : function(userCtx) {
//            alert("hello "+userCtx.name);
//        }, 
//        loggedOut : function() {
//            alert("bye bye");
//        }
//    });

(function($) {
    $.fn.couchLogin = function(opts) {
        var elem = $(this);
        opts = opts || {};
        function initWidget() {
            $.couch.session({
                success : function(session) {
                    var userCtx = session.userCtx;
                    if (userCtx.name) {
                        elem.empty();
                        elem.append(loggedIn(session));
                        if (opts.loggedIn) {opts.loggedIn(session)}
                    } else if (userCtx.roles.indexOf("_admin") != -1) {
                        elem.html(templates.adminParty);
                    } else {
                        elem.html(templates.loggedOut);
                        if (opts.loggedOut) {opts.loggedOut()}
                    };
                }
            });
        };
        initWidget();
        function doLogin(name, pass) {
            $.couch.login({name:name, password:pass, success:initWidget});
        };
        elem.delegate("a[href=#signup]", "click", function() {
            elem.html(templates.signupForm);
            elem.find('input[name="name"]').focus();
            return false;
        });
        elem.delegate("a[href=#login]", "click", function() {
            elem.html(templates.loginForm);
            elem.find('input[name="name"]').focus();
            return false;
        });
        elem.delegate("a[href=#logout]", "click", function() {
            $.couch.logout({success : initWidget});
            return false;
        });
        elem.delegate("form.login", "submit", function() {
            doLogin($('input[name=name]', this).val(),  
                $('input[name=password]', this).val());
            return false;
        });
        elem.delegate("form.signup", "submit", function() {
            var name = $('input[name=name]', this).val(),  
                pass = $('input[name=password]', this).val();
            $.couch.signup({name : name}, pass, {
                success : function() {doLogin(name, pass)}
            });
            return false;      
        });
    }
    var templates = {
        adminParty : '<p><strong>Admin party, everyone is admin!</strong> Fix this in <a href="/_utils/index.html">Futon</a> before proceeding.</p>',
        loggedOut : '<ul class="nav pull-right"><li><a href="#login">Login</a></li></ul>',
        loginForm : '<form class="login navbar-form pull-right"><input type="text" name="name" value="" autocapitalize="off" autocorrect="off" placeholder="Name" class="input-small"> <input type="password" name="password" value="" placeholder="Password" class="input-small"> <button type="submit" class="btn">Login</button></form>',
        signupForm : ''
    };
    function loggedIn(r) {
        var auth_db = encodeURIComponent(r.info.authentication_db)
        , uri_name = encodeURIComponent(r.userCtx.name)
        , span = $('<ul class="nav pull-right"><li><a target="_new" href="/_utils/document.html?'
            + auth_db +'/org.couchdb.user%3A' + uri_name 
            + '" class="name"><i class="icon-user"></i> ' + r.userCtx.name + '</a></li> <li><a href="#logout" title="Logout"><i class="icon-off" alt="logout"></i></a></li></ul>');
        return span;
    }
})(jQuery);
