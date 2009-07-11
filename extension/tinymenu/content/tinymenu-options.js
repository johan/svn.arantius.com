function optionsMemToXul() {
	document.getElementById('pref-fullscreenVisible').checked=
		tinymenu.fullscreenVisible;

	var cont=document.getElementById('menu_choices');

	for (var winId in tinymenu.allMenus) {
		var menus=tinymenu.allMenus[winId];

		var winCont=document.createElement('vbox');
		winCont.setAttribute('id', winId);

		var descr=document.createElement('description');
		descr.textContent=winId.split('\t')[1];
		winCont.appendChild(descr);

		for (var menuId in menus) {
			var menu=menus[menuId];

			var cbox=document.createElement('checkbox');
			cbox.setAttribute('id', menuId);
			cbox.setAttribute('label', menuId.split('\t')[1]);
			cbox.setAttribute('checked', !menus[menuId]);
			
			winCont.appendChild(cbox);
		}

		cont.appendChild(winCont);
	}
}

function optionsXulToMem() {
	tinymenu.fullscreenVisible=
		document.getElementById('pref-fullscreenVisible').checked;

	var cont=document.getElementById('menu_choices');
	var wins=cont.getElementsByTagName('vbox');
	for (var i=0, win=null; win=wins[i]; i++) {
		var winId=win.getAttribute('id');

		var menus=win.getElementsByTagName('checkbox');
		for (var j=0, menu=null; menu=menus[j]; j++) {
			var menuId=menu.getAttribute('id');
			tinymenu.allMenus[winId][menuId]=!menu.checked;
		}
	}
}

window.addEventListener('load', function() {
	tinymenu.optionsPrefsToMem();
	optionsMemToXul();
}, false);
