var tinymenu={

prefBranch:Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("tinymenu."),
allMenus:{},
fullscreenVisible:null,

onLoad:function() {
	tinymenu.optionsPrefsToMem();

	// Open the first run page, if we haven't before.
	if (tinymenu.prefBranch.getBoolPref('firstRun')) {
		tinymenu.prefBranch.setBoolPref('firstRun', false);
		try {
			gBrowser.selectedTab=gBrowser.addTab(
				'http://trac.arantius.com/wiki/Extensions/TinyMenu#Documentation'
			);
		} catch (e) {
			// Silent fail in Thunderbird.
		}
	}

	// Find the main menu.
	var menubar=
		document.getElementById('main-menubar') || // Firefox
		document.getElementById('mail-menubar') ;  // Thunderbird
	if (!menubar) return;
	// Find our menu popup.
	var menusub=document.getElementById('tinymenu-popup');

	// Save this window as "seen".
	var winId=document.location.href;
	if ('undefined'==typeof tinymenu.allMenus[winId]) {
		tinymenu.allMenus[winId]={
			'title':document.title.replace(/:.*/, ''),
			'menus':{
				'tinymenu':{'collapse':false}
			}
		};
	}
	var menus=tinymenu.allMenus[winId].menus;

	// With each menu ...
	var movedMenus=0;
	for (var i=0, el=null; el=menubar.childNodes[i]; i++) {
		if ('menu'!=el.tagName) continue;

		if ('tinymenu'==el.id) {
			var id='tinymenu';
		} else {
			// Save as "seen" this menu, if it doesn't exist.
			var id=el.getAttribute('id');
			if ('undefined'==typeof menus[id]) {
				menus[id]={
					'name':el.getAttribute('label'),
					'collapse':true
				};
			}
		}

		// Conditionally move it into the tiny menu, or enable image mode.
		if (menus[id].collapse) {
			menusub.appendChild(el);
			i--;
			movedMenus++;
		} else if (menus[id].image) {
			var imageNode=document.createElement('image');
			imageNode.setAttribute('src', menus[id].image);

			el.className='menu-iconic';
			el.insertBefore(imageNode, el.firstChild);
		}
	}

	// If we didn't move any menus, remove the tiny menu.
	if (0==movedMenus) {
		var tinymenuEl=document.getElementById('tinymenu');
		tinymenuEl.parentNode.removeChild(tinymenuEl);
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

    // #212 Interoperate with PrefBar
	if ('function'==typeof window.prefbarBrowserToolboxCustomizeDone) {
		window.prefbarBrowserToolboxCustomizeDone();
	}
},

checkUpgrade:function() {
	var ver202=['2', '0', '2'];

	var oldVer=tinymenu.prefBranch.getCharPref('version').split('.');
	var curVer=Components
		.classes["@mozilla.org/extensions/manager;1"]
		.getService(Ci.nsIExtensionManager)
		.getItemForID('{d33c2f7c-b1e6-4d46-ab0e-be1f6d05c904}')
		.version.split('.');

	if ( oldVer<ver202 && curVer>=ver202 ) {
		// Load the current settings.
		tinymenu.optionsPrefsToMem();

		// Fix up the format.
		tinymenu.upgrade202();
		
		// Save the new format.
		tinymenu.optionsMemToPrefs();
	}

	var oldVer=tinymenu.prefBranch.setCharPref('version', curVer.join('.'));
},

upgrade202:function() {
	var newMenus={};

	for (windowId in tinymenu.allMenus) {
		var win=tinymenu.allMenus[windowId];
		var winUrl=windowId.split('\t')[0];

		var newWin={'title':windowId.split('\t')[1], menus:{}};

		// Skip broken records.
		if (''==newWin.title) continue;

		for (menuId in win) {
			var menu=win[menuId];
			dump(uneval(menu)+'\n');
			
			var newMenuId=menuId.split('\t')[0];
			var newMenuName=menuId.split('\t')[1];

			var newMenu={'collapse':menu.collapse};
			if (newMenuName) newMenu.name=newMenuName;
			if (menu.image) newMenu.image=menu.image;

			newWin.menus[newMenuId]=newMenu;
		}

		newMenus[winUrl]=newWin;
	}

	dump('\n'+uneval(newMenus)+'\n\n');
	// Save new menus in memory.
	tinymenu.allMenus=newMenus;
},

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

optionsPrefsToMem:function() {
	eval( 'tinymenu.allMenus='+tinymenu.prefBranch.getCharPref('allMenus') );
	tinymenu.fullscreenVisible=tinymenu.prefBranch.getBoolPref('fullscreenVisible');
},

optionsMemToPrefs:function() {
	tinymenu.prefBranch.setCharPref('allMenus', uneval(tinymenu.allMenus));
	tinymenu.prefBranch.setBoolPref('fullscreenVisible', tinymenu.fullscreenVisible);
}

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

}
