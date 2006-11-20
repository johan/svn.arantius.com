var tinymenu={

menuIds:[],
doNotCollapse:'',

viewMode:null,
iconFile:null,

initPref:function() {
	var prefs=Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("tinymenu.");

	tinymenu.doNotCollapse=prefs.getCharPref('doNotCollapse');
	tinymenu.viewMode=prefs.getCharPref('viewMode');
	
	try {
		tinymenu.iconFile=prefs.getComplexValue(
			'iconFile', Components.interfaces.nsILocalFile
		);
	} catch (e) {  }
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

	// if we're set to image mode, inject the image
	if ('image'==tinymenu.viewMode) {
//		// http://developer.mozilla.org/en/docs/Using_the_Stylesheet_Service
//		var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
//			.getService(Components.interfaces.nsIStyleSheetService);
//		var ios = Components.classes["@mozilla.org/network/io-service;1"]
//			.getService(Components.interfaces.nsIIOService);
//		var uri = ios.newURI("chrome://tinymenu/content/icon.css", null, null);
//		sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);

		var m=document.getElementById('tinymenu');
		m.style.backgroundImage='url('+tinymenu.uriForFile(tinymenu.iconFile)+')';
		m.style.backgroundPosition='50% 50%';
		m.style.backgroundRepeat='no-repeat';
		m.style.minWidth='32px';
		m.removeAttribute('label');

		for (i in m.style) { dump(i+'\n') }
	}
},

loadOptions:function() {
	tinymenu.initPref();

	// set checkboxes
	var r, id;
	for (var i in tinymenu.menuIds) {
		id=tinymenu.menuIds[i];
		r=new RegExp('\\b'+id+'\\b');
		document.getElementById('pref-'+id).checked=
			(null!=r.exec(tinymenu.doNotCollapse));
	}

	// set radio
	if ('image'==tinymenu.viewMode) {
		document.getElementById('view_text').setAttribute('selected', false);
		document.getElementById('view_image').setAttribute('selected', true);
	}
},

saveOptions:function() {
	// build doNotCollapse string
	var doNotCollapse='tinymenu';
	var r, id;
	for (var i in tinymenu.menuIds) {
		id=tinymenu.menuIds[i];

		if (document.getElementById('pref-'+id).checked) {
			doNotCollapse+=' '+id;
		}
	}
	tinymenu.doNotCollapse=doNotCollapse;

	// save all the bits
	var prefs=Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("tinymenu.");

	prefs.setCharPref('doNotCollapse', doNotCollapse);
	prefs.setCharPref('viewMode', 
		document.getElementById('view_image').getAttribute('selected')?
		'image':'text'
	);

	if (tinymenu.iconFile &&
		tinymenu.iconFile.QueryInterface(Components.interfaces.nsILocalFile)
	) {
		prefs.setComplexValue('iconFile', Components.interfaces.nsILocalFile, tinymenu.iconFile);
	} else {
		prefs.setCharPref('iconFile', '');
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
	var ioService=Components.classes["@mozilla.org/network/io-service;1"]
		.getService(Components.interfaces.nsIIOService);
	var fileHandler=ioService.getProtocolHandler("file")
		.QueryInterface(Components.interfaces.nsIFileProtocolHandler);
	return fileHandler.getURLSpecFromFile(file);
}

}//end var tinymenu

if ('undefined'==typeof gInOptions || !gInOptions) {
	window.addEventListener('load', tinymenu.onLoad, false);
}
