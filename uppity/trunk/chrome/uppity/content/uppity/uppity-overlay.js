//this is directly adapted from a bookmarklet I wrote some time ago
//so the variables are all terse.  a later version should see a 
//revamp of this code but I'm proud to finally have written my first
//firefox extension from scratch!

function uppity() {
	var l=getBrowser().contentWindow.location, 
		L=false, h=l.href, S='/', s=l.protocol+S+S,
		d=l.pathname, i=d.indexOf(S), j=d.lastIndexOf(S);
	if (l.hash) {
		L=h.replace(l.hash, '')
	} else if (l.search) {
		L=h.replace(l.search, '')
	} else if (S==d) {
		if (s.match('http'))i='www.';
		if(s.match('ftp'))i='ftp.';
		if(h.match(i))L=h.replace(i, '')
	} else if(j+1==d.length) {
		L='..'
	} else {
		L='.'
	}
	if (L) l.assign(L);
}
