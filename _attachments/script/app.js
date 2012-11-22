angular.module('Acralyzer', ['acra-storage'])






///////////////////////////////////
// Apache 2.0 J Chris Anderson 2011
$(function() {   
    // friendly helper http://tinyurl.com/6aow6yn
    $.fn.serializeObject = function() {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    $.couchProfile.templates.profileReady = $("#new-message").html();
    $("#account").couchLogin({
        loggedIn : function(r) {
            $("#profile").couchProfile(r, {
                profileReady : function(profile) {
                    $("#create-message").submit(function(e){
                        e.preventDefault();
                        var form = this, doc = $(form).serializeObject();
                        doc.created_at = new Date();
                        doc.profile = profile;
                        db.saveDoc(doc, {success : function() {form.reset();}});
                        return false;
                    }).find("input").focus();
                }
            });
            e = document.getElementById('content');
            scope = angular.element(e).scope();
            scope.$apply(function() {
               scope.getData();
            });
            e = document.getElementById('graph-container');
            scope = angular.element(e).scope();
            scope.$apply(function() {
               scope.getData();
            });

            
        },
        loggedOut : function() {
            $("#profile").html('<p>Please log in to see your profile.</p>');
        }
    });
 });