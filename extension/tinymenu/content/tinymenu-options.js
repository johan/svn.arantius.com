window.addEventListener('load', function() {
	tinymenu.optionsPrefsToMem();
	optionsMemToXul();
}, false);

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function optionsMemToXul() {
	document.getElementById('pref-fullscreenVisible').checked=
		tinymenu.fullscreenVisible;

	var cont=document.getElementById('menu_choices');

	var numWindows=0;
	for (var winId in tinymenu.allMenus) {
		numWindows++;
	}

	for (var winId in tinymenu.allMenus) {
		var win=tinymenu.allMenus[winId]
		var menus=win.menus;

		var winCont=document.createElement('vbox');
		winCont.setAttribute('id', winId);
		winCont.setAttribute('class', 'winCol');

		if (numWindows>1) {
			var descr=document.createElement('description');
			descr.setAttribute('class', 'window');
			descr.textContent=win.title;
			winCont.appendChild(descr);
		}

		for (var menuId in menus) {
			var menu=menus[menuId];

			var hbox=document.createElement('hbox');

			var cbox=document.createElement('checkbox');
			cbox.setAttribute('id', menuId);
			if ('tinymenu'==menuId) {
				cbox.setAttribute('label', window.document.title);
				cbox.setAttribute('checked', true);
				cbox.setAttribute('disabled', true);
			} else {
				cbox.setAttribute('label', menu.name);
				cbox.setAttribute('checked', !menu.collapse);
			}
			cbox.addEventListener('click', collapseCheckChange, false)
			hbox.appendChild(cbox);

			var spacer=document.createElement('spacer');
			spacer.setAttribute('flex', '1');
			hbox.appendChild(spacer);

			var imageButton=document.createElement('button');
			imageButton.allMenusNode=menu;
			imageButton.menuId=menuId;
			imageButton.addEventListener('command', openImageDialog, false);
			hbox.appendChild(imageButton);
			imageButtonChange(null, imageButton);
			
			winCont.appendChild(hbox);
		}

		cont.appendChild(winCont);
	}

	setTimeout(window.sizeToContent, 10);
}

function optionsXulToMem() {
	tinymenu.fullscreenVisible=
		document.getElementById('pref-fullscreenVisible').checked;

	var cont=document.getElementById('menu_choices');
	var wins=cont.getElementsByTagName('vbox');
	for (var i=0, win=null; win=wins[i]; i++) {
		var winId=win.getAttribute('id');

		var cboxes=win.getElementsByTagName('checkbox');
		for (var j=0, cbox=null; cbox=cboxes[j]; j++) {
			var menuId=cbox.getAttribute('id');
			tinymenu.allMenus[winId].menus[menuId].collapse=!cbox.checked;
		}
	}
}

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function collapseCheckChange(event) {
	var cbox=event.target;
	var imageButton=cbox.parentNode.getElementsByTagName('button')[0];

	// The setTimeout makes the checked attribute change before it runs.
	setTimeout(imageButtonChange, 0, null, imageButton);
}

function imageButtonChange(event, button) {
	if (event && event.target) button=event.target;
	if (!button) return;

	var cbox=button.parentNode.getElementsByTagName('checkbox')[0];

	button.setAttribute('disabled', 'true'!=cbox.getAttribute('checked'));
	button.setAttribute(
		'image',
		'chrome://tinymenu/skin/image-'+(button.allMenusNode.image?'on':'off')+'.png'
	);
}

function openImageDialog(event) {
	openDialog(
		'chrome://tinymenu/content/tinymenu-image.xul',
		'',
		'modal',
		event.target
	);
	imageButtonChange(event);
}
