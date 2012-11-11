function(doc) {
  if (doc.USER_CRASH_DATE) {
      emit(new Date(doc.USER_CRASH_DATE), {
          user_crash_date: doc.USER_CRASH_DATE,
          stack_trace:doc.STACK_TRACE,
          android_version : doc.ANDROID_VERSION
      });
  }
};