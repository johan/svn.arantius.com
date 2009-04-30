var mpwgen={
masterPw:null,

run:function() {
	if (this.masterPw) {
		this.fillforms(this.masterPw);
	} else {
		window.openDialog(
			'chrome://mpwgen/content/mpwgen-prompt-master.xul',
			'_blank',
			'dialog=no,centerscreen,resizable=no,chrome,dependent'
		);
	}
},

hash:function(s) {
	//rather cryptic code taken directly from my bookmarklet version
	var C='0123456789abcdefghijklmnopqrstuvwxyz.',h=7919,i,j='';
	for (i=0;i<s.length;i++) {h=((h<<5)+h)+C.indexOf(s.charAt(i))}
	while (h!=0) {j+=C.charAt(h % 16);h=h>>>4;}
	return j;
},

oneElXpath:function(doc, exp) {
	var result=doc.evaluate(
		exp, doc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
	);
	return result.snapshotItem(0);
},

fillforms:function(master, remember) {
	if (('undefined'!=typeof remember) && remember) {
		this.masterPw=master;
	}

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
		var host='';
		try {
			host=String(
				String(win.location.host).match(/[^.]*\.[^.]*$/)[0]
			).toLowerCase();
		} catch (e) { }
		
		var user=this.getPref('string', 'mpwgen.username');
		var email=this.getPref('string', 'mpwgen.email');
		// substitute wildcard address
		if ('@'==email.charAt(0)) email=host.match(/[^.]*/)+email;
		// substitute plus address
		email=email.replace('+@', '+'+host.match(/[^.]*/)+'@');

		var pass=this.hash(host+master),j;
		var els=win.document.getElementsByTagName('input');

		for (var j=0, el; el=els[j]; j++) {
			var type=mpwgen.findFieldType(win, el);

			if (!type) {
				continue;
			} else if ('password'==type) {
				el.focus();
				el.value=pass;

				// For any password field, disable autocomplete on its form.
				if (this.getPref('bool', 'mpwgen.autoCompOff') && el.form) {
					el.form.setAttribute('autocomplete', 'off');
				}

				if (el.form) el.form.setAttribute('mpwgen', '1');
			} else if ('user'==type && ''!=user) {
				el.focus();
				el.value=user;
			} else if ('email'==type && ''!=email) {
				el.focus();
				el.value=email;
			} else 	if ('submit'==type) {
				// For submit buttons in a form we filled, focus.
				if (el.form && '1'==el.form.getAttribute('mpwgen')) {
					el.focus();
				}
			}
		}
	} catch (e) { this.dumpErr(e) }
	return true;
},

findFieldType:function(win, el) {
	// In these cases, we *know* it's not a field we want to deal with.
	if (el.type in {
		'checkbox':1, 'hidden':1, 'radio':1, 'submit':1
	}) {
		return null;
	}

	// Fields with exact name or type 'password' are clear.
	if ( 'password'==String(el.type)
		|| 'password'==String(el.name).toLowerCase()
	) {
		return 'password';
	}

	// Submit and image type fields are clear.
	if ('submit'==el.type || 'image'==el.type) {
		return 'submit';
	}

	var userScore=0;
	var emailScore=0;
	var label=null;

	// Find label text.
	if (''!=el.id) {
		// If we have an id, try to find the label for it.
		label=this.oneElXpath(
			win.document, '//label[@for="'+el.id+'"]'
		);
	} else {
		// Try to find the label this el is _in_.
		label=el;
		while (label && 'LABEL'!=label.tagName) {
			label=label.parentNode;
		}
	}

	var txt='';
	if (label) {
		// If we have a label, use its text.
		txt=label.textContent;
	} else {
		// If we don't, try to find some surrounding text.
		try {
			var tmpid='mpwgen'+String(Math.random()).substr(2);
			var tmptxt=win.document.createTextNode(tmpid);

			// Put in our temp text to look for.
			el.appendChild(tmptxt);

			// Look for 20 (non whitespace) chars before that marker.
			var txt=win.document.body.textContent.replace(/\s+/g, ' ');
			var pos=txt.indexOf(tmpid);
			txt=txt.substring(pos-20, pos);

			// Remove our marker.
			el.removeChild(tmptxt);
		} catch (e) {
			this.dumpErr(e);
			txt='';
		}
	}

	if (txt.match(/\b(e-?mail)\b/i)
		|| el.name.match(/^e$|e-?mail/i)
	) {
		return 'email';
	}

	if (txt.match(/\b((user|member) ?name|log ?in|id)\b/i)
		|| el.name.match(/user|username|login|id/i)
	)  {
		return 'user';
	}

	// If I didn't match something above, I don't know!
	dump([
		'mpwgen unknown field!',
		'type: '+el.type,
		'label: '+label,
		'text: '+txt,
	''].join('\n'));

	return null;
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
	window.document.getElementById('mpwgen-rememberDefault').checked=this.getPref('bool', 'mpwgen.rememberDefault');
	} catch (e) { this.dumpErr(e) }
	return true;
},

saveOptions:function() {
	try {
	this.setPref('string', 'mpwgen.username', window.document.getElementById('mpwgen-username').value);
	this.setPref('string', 'mpwgen.email', window.document.getElementById('mpwgen-email').value);
	this.setPref('bool', 'mpwgen.autoCompOff', window.document.getElementById('mpwgen-autoCompOff').checked);
	this.setPref('bool', 'mpwgen.rememberDefault', window.document.getElementById('mpwgen-rememberDefault').checked);
	} catch (e) { this.dumpErr(e) }
	return true;
},

dumpErr:function(e) {
	var s='Error in mpwgen: ';
	s+='Line: '+e.lineNumber+'\n';
	s+=e.name+': '+e.message+'\n';
	dump(s);
},

onload:function(event) {
	window.removeEventListener('load', mpwgen.onload, false);

	var el=document.getElementById("contentAreaContextMenu");
	if (el) el.addEventListener("popupshowing", mpwgen.popupshowing, false);
},

popupshowing:function(event) {
	var show=!('password'==gContextMenu.target.type);
	document.getElementById("mpwgen-context").setAttribute('hidden', show);
},


promptLoad:function() {
	window.document.getElementById('remember').checked=
		this.getPref('bool', 'mpwgen.rememberDefault');;
	window.document.getElementById('master-pw').focus();
},

promptAccept:function() {
	window.opener.mpwgen.fillforms(
		window.document.getElementById('master-pw').value,
		window.document.getElementById('remember').checked
	);
}

}//end mpwgen object

window.addEventListener('load', mpwgen.onload, false);
