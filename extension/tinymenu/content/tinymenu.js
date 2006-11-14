var tinymenu={

menuIds:[],
doNotCollapse:'',

initPref:function() {
	var prefService=Components.classes['@mozilla.org/preferences-service;1']
		.getService(Components.interfaces.nsIPrefBranch);
	tinymenu.doNotCollapse=prefService.getCharPref('tinymenu.doNotCollapse');
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
},

loadOptions:function() {
	tinymenu.initPref();

	var r, id;
	for (var i in tinymenu.menuIds) {
		id=tinymenu.menuIds[i];
		dump('Menu id '+id+'\n');

		r=new RegExp('\\b'+id+'\\b');
		document.getElementById('pref-'+id).checked=
			r.exec(tinymenu.doNotCollapse);
	}
},

saveOptions:function() {
	var opt='tinymenu';

	var r, id;
	for (var i in tinymenu.menuIds) {
		id=tinymenu.menuIds[i];

		if (document.getElementById('pref-'+id).checked) {
			opt+=' '+id;
		}
	}
	
	if (tinymenu.doNotCollapse!=opt) {
		tinymenu.doNotCollapse=opt;

		var prefService=Components.classes['@mozilla.org/preferences-service;1']
			.getService(Components.interfaces.nsIPrefBranch);
		prefService.setCharPref('tinymenu.doNotCollapse', opt);
	}
}

}//end var tinymenu

if ('undefined'==typeof gInOptions || !gInOptions) {
	window.addEventListener('load', tinymenu.onLoad, false);
}
