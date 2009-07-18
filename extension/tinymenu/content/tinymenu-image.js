var gOptionsButton;
var gImageUrl;

window.addEventListener('load', function() {
	gOptionsButton=window.arguments[0];

	if ('tinymenu'==gOptionsButton.menuId) {
		document.getElementById('defaultButton')
			.setAttribute('collapsed', 'false');
	}

	selectText();

	gImageUrl=false;
	if (gOptionsButton.allMenusNode.image) {
		selectImage(gOptionsButton.allMenusNode.image);
		gImageUrl=gOptionsButton.menuId.image;
	}

	window.moveToAlertPosition();
}, false);

function applyImageSetting() {
	gOptionsButton.allMenusNode.image=gImageUrl;
}

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function selectText() {
	gImageUrl=false;
	setRadios('text');
}

function selectImage(url) {
	gImageUrl=url;
	setRadios('image');
}

function setRadios(mode) {
	document.getElementById('view_text').setAttribute('selected', 'text'==mode);
	document.getElementById('view_image').setAttribute('selected', 'text'!=mode);
}

function defaultImage() {
	selectImage('chrome://tinymenu/skin/tinymenu.png');
}

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function mimeForFile(file) {
	var mime=Components.classes["@mozilla.org/mime;1"]
		.getService().QueryInterface(Components.interfaces.nsIMIMEService);
	try {
		mime=mime.getTypeFromFile(file);
	} catch (e) {
		mime='';
	}

	return mime;
}

function uriForFile(file) {
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
}

function browseImage() {
	// based on sample from
	// http://developer.mozilla.org/en/docs/nsIFilePicker

	const nsIFilePicker = Components.interfaces.nsIFilePicker;

	var fp = Components.classes["@mozilla.org/filepicker;1"]
		.createInstance(nsIFilePicker);
	fp.init(window, '', nsIFilePicker.modeOpen);
	fp.appendFilters(nsIFilePicker.filterImages);

	var rv=fp.show();
	if (rv==nsIFilePicker.returnOK) {
		var mime=mimeForFile(fp.file);

		if (!mime.match(/^image/)) {
			alert("Whoops, that doesn't seem to be an image!");
		} else {
			selectImage(uriForFile(fp.file));
		}
	}
}
