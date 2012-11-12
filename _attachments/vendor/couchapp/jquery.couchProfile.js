// Copyright Chris Anderson 2011
// Apache 2.0 License
// jquery.couchProfile.js
// depends on md5, 
// jquery.couchLogin.js and requires.js
// 
// Example Usage (loggedIn and loggedOut callbacks are optional): 
//    $("#myprofilediv").couchProfile({
//        profileReady : function(profile) {
//            alert("hello, do you look like this? "+profile.gravatar_url);
//        }
//    });

(function($) {
    $.couchProfile = {};
    $.couchProfile.templates = {
        profileReady : '<div class="avatar">{{#gravatar_url}}<img src="{{gravatar_url}}"/>{{/gravatar_url}}<div class="name">{{nickname}}</div></div><p>Hello {{nickname}}!</p><div style="clear:left;"></div>',
        newProfile : '<form><p>Hello {{name}}, Please setup your user profile.</p><label for="nickname">Nickname <input type="text" name="nickname" value=""></label><label for="email">Email (<em>for <a href="http://gravatar.com">Gravatar</a></em>) <input type="text" name="email" value=""></label><label for="url">URL <input type="text" name="url" value=""></label><input type="submit" value="Go &rarr;"><input type="hidden" name="userCtxName" value="{{name}}" id="userCtxName"></form>'
    };
    
    $.fn.couchProfile = function(session, opts) {
        opts = opts || {};
        var templates = $.couchProfile.templates;
        var userCtx = session.userCtx;
        var widget = $(this);
        // load the profile from the user doc
        var db = $.couch.db(session.info.authentication_db);
        var userDocId = "org.couchdb.user:"+userCtx.name;
        db.openDoc(userDocId, {
            success : function(userDoc) {
                var profile = userDoc["couch.app.profile"];
                if (profile) {
                    profile.name = userDoc.name;
                    profileReady(profile);
                } else {
                    newProfile(userCtx)
                }
            }
        });
        
        function profileReady(profile) {
            widget.html($.mustache(templates.profileReady, profile));
            if (opts.profileReady) {opts.profileReady(profile)};
        };
        
        function storeProfileOnUserDoc(newProfile) {
            // store the user profile on the user account document
            $.couch.userDb(function(db) {
              var userDocId = "org.couchdb.user:"+userCtx.name;
              db.openDoc(userDocId, {
                success : function(userDoc) {
                  userDoc["couch.app.profile"] = newProfile;
                  db.saveDoc(userDoc, {
                    success : function() {
                      newProfile.name = userDoc.name;
                      profileReady(newProfile);
                    }
                  });
                }
              });
            });
        };
        
        function newProfile(userCtx) {
            widget.html($.mustache(templates.newProfile, userCtx));
            widget.find("form").submit(function(e) {
            e.preventDefault();
            var form = this;
                var name = $("input[name=userCtxName]",form).val();
                var newProfile = {
                  rand : Math.random().toString(), 
                  nickname : $("input[name=nickname]",form).val(),
                  email : $("input[name=email]",form).val(),
                  url : $("input[name=url]",form).val()
                };
                // setup gravatar_url if md5.js is loaded
                if (hex_md5) {
                  newProfile.gravatar_url = 'http://www.gravatar.com/avatar/'+hex_md5(newProfile.email || newProfile.rand)+'.jpg?s=40&d=identicon';    
                }
                storeProfileOnUserDoc(newProfile);
              return false;
            });
        };
    }
})(jQuery);
