var tinymenu={

prefBranch:Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("tinymenu."),
allMenus:{},
fullscreenVisible:null,

onLoad:function() {
	tinymenu.optionsPrefsToMem();

	// Find the main menu.
	var menubar=
		document.getElementById('main-menubar') || // Firefox
		document.getElementById('mail-menubar') ;  // Thunderbird
	if (!menubar) return;
	// Find our menu popup.
	var menusub=document.getElementById('tinymenu-popup');

	// Save this window as "seen".
	var winId=document.location.href+'\t'+document.title;
	if ('undefined'==typeof tinymenu.allMenus[winId]) {
		tinymenu.allMenus[winId]={'tinymenu':{'collapse':false}};
	}
	var menus=tinymenu.allMenus[winId];

	// With each menu ...
	for (var i=0, el=null; el=menubar.childNodes[i]; i++) {
		if ('tinymenu'==el.id) {
			var id=el.id;
		} else {
			// Save as "seen" this menu, if it doesn't exist.
			var id=el.getAttribute('id')+'\t'+el.getAttribute('label');
			if ('undefined'==typeof menus[id]) {
				menus[id]={'collapse':true};
			}
		}

		// Conditionally move it into the tiny menu.
		if (menus[id].collapse) {
			menusub.appendChild(el);
			i--;
		} else if (menus[id].image) {
			var imageNode=document.createElement('image');
			imageNode.setAttribute('src', menus[id].image);

			el.className='menu-iconic';
			el.insertBefore(imageNode, el.firstChild);
		}
	}

	// Save the options in case seen menus has changed.
	tinymenu.optionsMemToPrefs();

	// Set full-screen-visible mode conditionally.
	try {
		document.getElementById('toolbar-menubar').setAttribute(
			'fullscreentoolbar', tinymenu.fullscreenVisible?'true':'false'
		);
	} catch (e) {
		// In case it's not available (Thunderbird).
	}
},

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

optionsPrefsToMem:function() {
	var prefs=Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("tinymenu.");

	eval( 'tinymenu.allMenus='+prefs.getCharPref('allMenus') );
	tinymenu.fullscreenVisible=prefs.getBoolPref('fullscreenVisible');
},

optionsMemToPrefs:function() {
	tinymenu.prefBranch.setCharPref('allMenus', uneval(tinymenu.allMenus));
	tinymenu.prefBranch.setBoolPref('fullscreenVisible', tinymenu.fullscreenVisible);
}

}
