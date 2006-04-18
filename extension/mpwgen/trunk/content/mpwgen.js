var mpwgen={
run:function() {
	var w = window.openDialog(
		'chrome://mpwgen/content/mpwgen-prompt-master.xul',
		'_blank',
		'dialog=no,centerscreen,resizable=no,chrome,dependent'
	);
},

hash:function(s) {
	//rather cryptic code taken directly from my bookmarklet version
	var C='0123456789abcdefghijklmnopqrstuvwxyz.',h=7919,i,j='';
	for (i=0;i<s.length;i++) {h=((h<<5)+h)+C.indexOf(s.charAt(i))}
	while (h!=0) {j+=C.charAt(h % 16);h=h>>>4;}
	return j;
},

fillforms:function(master) {
	try {
		var win=getBrowser().contentWindow;
		this.fillwindow(master, win);
		for (var i=0; i<win.frames.length; i++) { 
			this.fillwindow(master, win.frames[i]); 
		}
	} catch (e) { this.dumpErr(e) }
	return true;
},

fillwindow:function(master, win) {
	try {
		var host=String(
			String(win.location.host).match(/[^.]*\.[^.]*$/)[0]
		).toLowerCase();
		
		var user=this.getPref('string', 'mpwgen.username');
		var email=this.getPref('string', 'mpwgen.email');
		if ('@'==email.charAt(0)) email=host.match(/[^.]*/)+email;

		var pass=this.hash(host+master),j;
		var els=win.document.getElementsByTagName('input');

		for (j=0;j<els.length;j++) {
			//dump('El: '+els[j]+' '+els[j].name+'\n');
			if ( 'password'==String(els[j].type) || 'password'==String(els[j].name).toLowerCase() ) {
				els[j].value=pass;
				els[j].focus();
				//for any password field, disable autocomplete on it's form
				if (this.getPref('bool', 'mpwgen.autoCompOff')) {
					dump(els[j]);
					els[j].form.setAttribute('autocomplete', 'off');
				}
			} else if ('text'==els[j].type) {
				//try to find the text around this input, it might hint
				//that this is for an email address even if it is
				//called, i.e., username (how stupid!)
				var txt='';
				try {
					var k=0, txtEl=els[j];
					while (true) {
						txtEl=txtEl.parentNode;
						if (k++>2) break; //this number is hard to tweak
						if ('TR'==txtEl.tagName) break;
					}
					txt=txtEl.textContent;
				} catch (e2) { this.dumpErr(e2) }
				/*
				dump(els[j].name+' "'+txt+'" is email:\n'+
					els[j].name.match(/e-?mail/i) 
					+' '+els[j].value.match(/e-?mail/i) 
					+' '+txt.match(/e-?mail/i) 
					+' '+txt.match(/^([0-9a-zA-Z]+[-._+&])*[0-9a-zA-Z]+@([-0-9a-zA-Z]+[.])+[a-zA-Z]{2,6}$/)
					+'\n'
				);
				/**/
				if ( els[j].name.match(/e-?mail/i) || els[j].value.match(/e-?mail/i) 
					|| txt.match(/e-?mail/i) 
					//this expression came from: http://www.regexlib.com/REDetails.aspx?regexp_id=1012
					|| txt.match(/\b([0-9a-zA-Z]+[-._+&])*[0-9a-zA-Z]+@([-0-9a-zA-Z]+[.])+[a-zA-Z]{2,6}\b/)
				) {
					els[j].value=email;
				} else if (els[j].name.match(/(login|user|nick)(name)?/i)) {
					els[j].value=user;
				}
			} else if ('submit'==els[j].type || 'image'==els[j].type) {
				//dump('Form: '+els[j].form.name+' Len: '+els[j].form.length+'\n');
			}
		}
	} catch (e) { this.dumpErr(e) }
	return true;
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
	window.document.getElementById('mpwgen-username').value=this.getPref('string', 'mpwgen.username');
	window.document.getElementById('mpwgen-email').value=this.getPref('string', 'mpwgen.email');
	window.document.getElementById('mpwgen-autoCompOff').checked=this.getPref('bool', 'mpwgen.autoCompOff');
	} catch (e) { this.dumpErr(e) }
	return true;
},

saveOptions:function() {
	try {
	this.setPref('string', 'mpwgen.username', window.document.getElementById('mpwgen-username').value);
	this.setPref('string', 'mpwgen.email', window.document.getElementById('mpwgen-email').value);
	this.setPref('bool', 'mpwgen.autoCompOff', window.document.getElementById('mpwgen-autoCompOff').checked);
	} catch (e) { this.dumpErr(e) }
	return true;
},

dumpErr:function(e) {
	var s='Error in mpwgen: ';
	s+='Line: '+e.lineNumber+'\n';
	s+=e.name+': '+e.message+'\n';
	dump(s);
},

}//end mpwgen object
