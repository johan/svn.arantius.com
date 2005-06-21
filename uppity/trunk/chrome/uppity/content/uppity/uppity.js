var uppity={
//this is directly adapted from a bookmarklet I wrote some time ago
//so the variables are all terse.  a later version should see a 
//revamp of this code but I'm proud to finally have written my first
//firefox extension from scratch!
goUp:function() {
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
},

getPref:function(type, name) {
	var pref = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch);
	try {
		switch(type) {
		case 'bool':   return pref.getBoolPref(name);
		case 'int':    return pref.getIntPref(name);
		case 'string':
		default:       return pref.getCharPref(name); 
		}
	} catch (e) { this.dumpErr(e) }
	return '';
},

setPref:function(type, name, value) {
	var pref = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch);
	try {
		switch (type) {
		case 'bool':   pref.setBoolPref(name, value); break;
		case 'int':    pref.setIntPref(name, value); break;
		case 'string':
		default:       pref.setCharPref(name, value); break;
		}
	} catch (e) { this.dumpErr(e) }
},

loadOptions:function() {
	try {
	window.document.getElementById('uppity-sb-icon').checked=this.getPref('bool', 'uppity.sb-icon');
	} catch (e) { this.dumpErr(e) }
	return true;
},

saveOptions:function() {
	try {
	this.setPref('bool', 'uppity.sb-icon',
		Boolean(window.document.getElementById('uppity-sb-icon').checked)
	);

	//this might be a little dirty ....
	window.opener.opener.uppity.setSBButtonVis();
	} catch (e) { this.dumpErr(e) }
	return true;
},

dumpErr:function(e) {
	var s='Error in mpwgen:\n';
	s+='Line: '+e.lineNumber+'\n';
	s+=e.name+': '+e.message+'\n';
	//s+='Stack:\n'+e.stack+'\n\n';
	dump(s);
},

setSBButtonVis:function() {
	var show=this.getPref('bool', 'uppity.sb-icon');
	var sb=document.getElementById('status-bar-uppity');
	sb.style.display=(show?'-moz-box':'none');
}
}//close var uppity
