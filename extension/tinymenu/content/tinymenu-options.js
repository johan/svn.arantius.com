const FIREFOX_ID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";
const THUNDERBIRD_ID = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";

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

var overlayObserver={
	observe: function (aSubject, aTopic, aData) {
		if ('xul-overlay-merged'==aTopic) {
			tinymenu.loadOptions();
			window.sizeToContent();
		}
	},

	QueryInterface: function(aIID) {
		return this;
	}
};
