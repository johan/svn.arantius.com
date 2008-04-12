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

window.addEventListener('load', tinymenu.loadOptions, false);
