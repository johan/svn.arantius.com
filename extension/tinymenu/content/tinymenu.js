var tinymenu={

menuIds:[],
doNotCollapse:'',

viewMode:null,
iconFile:null,
fullscreenVisible:null,

initPref:function() {
	var prefs=Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("tinymenu.");

	tinymenu.doNotCollapse=prefs.getCharPref('doNotCollapse');
	tinymenu.viewMode=prefs.getCharPref('viewMode');
	tinymenu.fullscreenVisible=prefs.getBoolPref('fullscreenVisible');

	try {
		tinymenu.iconFile=prefs.getComplexValue(
			'iconFile', Components.interfaces.nsILocalFile
		);
	} catch (e) {
		// this is a little lame, but it works
		tinymenu.iconFile='chrome://tinymenu/skin/tinymenu.png';
	}
},

onLoad:function() {
	tinymenu.initPref();

	if ('function'==typeof gTinymenuTbFix) {
		gTinymenuTbFix();
	}

	//find the main menu
	var menubar=document.getElementById('main-menubar') || //firefox
		document.getElementById('mail-menubar') ; //thunderbird
	if (!menubar) return;
	//find our menu popup
	var menusub=document.getElementById('tinymenu-popup');

	//move each of the menus into the sub menu
	var el, r;
	for (var i=menubar.childNodes.length-1; i>=0; i--) {
		el=menubar.childNodes[i];

		// some thunderbird menus don't have IDs!
		if (el.id) {
			r=new RegExp('\\b'+el.id+'\\b');
			if (r.exec(tinymenu.doNotCollapse)) continue;
		}

		menubar.removeChild(el);
		menusub.insertBefore(el, menusub.firstChild);
	}

	//put the new items in our menu popup
	var menupop=document.getElementById('tinymenu');
	menupop.appendChild(menusub);

	tinymenu.activateViewMode();
	tinymenu.setFullscreenVisible();
},

// Move the 'fullscr-toggler' so that CSS can target the menu toolbar */
setFullscreenVisible:function(set) {
	if ('undefined'==typeof set) {
		set=tinymenu.fullscreenVisible;
	}

	try {
		document.getElementById('toolbar-menubar').setAttribute(
			'fullscreentoolbar', set?'true':'false'
		);
	} catch (e) {
		// In case it's not available (Thunderbird).
	}
},

mimeForFile:function(file) {
	var mime=Components.classes["@mozilla.org/mime;1"]
		.getService().QueryInterface(Components.interfaces.nsIMIMEService);
	try {
		mime=mime.getTypeFromFile(file);
	} catch (e) {
		mime='';
	}

	return mime;
},

uriForFile:function(file) {
	// special case for the default
	if ('string'==typeof file && 'chrome:'==file.substring(0, 7)) {
		return file;
	}

	// otherwise, work your mojo
	var ioService=Components.classes["@mozilla.org/network/io-service;1"]
		.getService(Components.interfaces.nsIIOService);
	var fileHandler=ioService.getProtocolHandler("file")
		.QueryInterface(Components.interfaces.nsIFileProtocolHandler);
	return fileHandler.getURLSpecFromFile(file);
},

withAllWindows:function(callback) {
	var ifaces=Components.interfaces;
	var mediator=Components.classes["@mozilla.org/appshell/window-mediator;1"].
		getService(ifaces.nsIWindowMediator);
	var win,winEnum=mediator.getEnumerator(null);
	while (winEnum.hasMoreElements()) {
		win=winEnum.getNext();
		callback(win);
	}
},

activateViewMode:function(mode) {
	if ('undefined'==typeof mode) {
		mode=tinymenu.viewMode;
	}

	tinymenu.withAllWindows(function(win) {
		var m=win.document.getElementById('tinymenu');
		if (!m) return;

		// if we're set to image mode, inject the image
		if ('image'==mode) {
			m.setAttribute('mode', 'image');
			m.style.backgroundImage='url('+
				tinymenu.uriForFile(tinymenu.iconFile)+
				')';
		} else {
			m.setAttribute('mode', 'text');
			m.style.backgroundImage='none';
		}
	});
}

}//end var tinymenu

if ('undefined'==typeof gInOptions || !gInOptions) {
	window.addEventListener('load', tinymenu.onLoad, false);
}
