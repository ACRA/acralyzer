// I think this should go in jquery.couch.js

(function($) {
    $.fn.couchForm = function(opts) {
        opts = opts || {};
        if (!opts.db) {
            opts.db = $.couch.db(document.location.pathname.split('/')[1]);
        }
        var form = $(this);
        form.submit(function(e) {
            e.preventDefault();
            var doc = form.serializeObject();
            if (opts.beforeSave) {
                doc = opts.beforeSave(doc);
            }
            opts.db.saveDoc(doc, {
              success : function() {
                  if (opts.success) {
                      opts.success(doc);
                  }
                  form[0].reset();
              }
            });
            return false;
        });
    };
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
})(jQuery);
