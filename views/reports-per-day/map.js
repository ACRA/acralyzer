function(doc) {
  if(doc.USER_CRASH_DATE) {
    var crashDate = new Date(doc.USER_CRASH_DATE);
    if(crashDate.getFullYear() > 2000) {
    	emit([crashDate.getFullYear(), crashDate.getMonth() , crashDate.getDate()], 1);
	}
  }
}