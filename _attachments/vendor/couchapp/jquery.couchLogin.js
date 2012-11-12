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
        loggedOut : '<a href="#signup">Signup</a> or <a href="#login">Login</a>',
        loginForm : '<form class="login"><label for="name">Name</label> <input type="text" name="name" value="" autocapitalize="off" autocorrect="off"><label for="password">Password</label> <input type="password" name="password" value=""><input type="submit" value="Login"><a href="#signup">or Signup</a></form>',
        signupForm : '<form class="signup"><label for="name">Name</label> <input type="text" name="name" value="" autocapitalize="off" autocorrect="off"><label for="password">Password</label> <input type="password" name="password" value=""><input type="submit" value="Signup"><a href="#login">or Login</a></form>'
    };
    function loggedIn(r) {
        var auth_db = encodeURIComponent(r.info.authentication_db)
        , uri_name = encodeURIComponent(r.userCtx.name)
        , span = $('<span>Welcome <a target="_new" href="/_utils/document.html?' 
            + auth_db +'/org.couchdb.user%3A' + uri_name 
            + '" class="name"></a>! <a href="#logout">Logout?</a></span>');
        $('a.name', span).text(r.userCtx.name); // you can get the user name here
        return span;
    }
})(jQuery);
