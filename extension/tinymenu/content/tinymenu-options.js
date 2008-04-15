function loadOptions() {
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
}

function saveOptions() {
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

	tinymenu.viewMode=
		document.getElementById('view_image').getAttribute('selected')?
		'image':'text';

	// save all the bits
	var prefs=Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("tinymenu.");

	prefs.setCharPref('doNotCollapse', tinymenu.doNotCollapse);
	prefs.setCharPref('viewMode', tinymenu.viewMode);

	// will fail in default case, so silently catch
	try {
		if (tinymenu.iconFile &&
			tinymenu.iconFile.QueryInterface(Components.interfaces.nsILocalFile)
		) {
			prefs.setComplexValue('iconFile', Components.interfaces.nsILocalFile, tinymenu.iconFile);
		}
	} catch (e) {  }
}

function browseImage() {
	// based on sample from
	// http://developer.mozilla.org/en/docs/nsIFilePicker

	const nsIFilePicker = Components.interfaces.nsIFilePicker;

	var fp = Components.classes["@mozilla.org/filepicker;1"]
		.createInstance(nsIFilePicker);
	fp.init(window, '', nsIFilePicker.modeOpen);
	fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

	var rv=fp.show();
	if (rv==nsIFilePicker.returnOK) {
		var mime=tinymenu.mimeForFile(fp.file);

		if (!mime.match(/^image/)) {
			alert("Whoops, that doesn't seem to be an image!");
		} else {
			tinymenu.iconFile=fp.file;

			document.getElementById('view_text').setAttribute('selected', false);
			document.getElementById('view_image').setAttribute('selected', true);

			tinymenu.activateViewMode('image');
		}
	}
}

function resetImage() {
	tinymenu.iconFile='chrome://tinymenu/skin/tinymenu.png';
	tinymenu.activateViewMode('image');
}

window.addEventListener('load', loadOptions, false);
