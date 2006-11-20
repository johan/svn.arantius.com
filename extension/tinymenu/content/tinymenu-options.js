const FIREFOX_ID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";
const THUNDERBIRD_ID = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";

window.addEventListener("load", function() {
	var appInfo=Components.classes["@mozilla.org/xre/app-info;1"]
		.getService(Components.interfaces.nsIXULAppInfo);
	
	if (FIREFOX_ID==appInfo.ID) {
		// firefox
		document.loadOverlay('chrome://tinymenu/content/tinymenu-options-ff.xul', overlayObserver);	

		tinymenu.menuIds=[
			'file-menu', 'edit-menu', 'view-menu', 'go-menu',
			'bookmarks-menu', 'tools-menu', 'helpMenu'
		];
	} else if (THUNDERBIRD_ID==appInfo.ID) {
		// thunderbird
		document.loadOverlay('chrome://tinymenu/content/tinymenu-options-tb.xul', overlayObserver);

		tinymenu.menuIds=[
			'menu_File', 'menu_Edit', 'menu_View', 'menu_Go',
			'messageMenu', 'tasksMenu', 'menu_Help'
		];
	} else {
		// another app
	}
}, true);

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
			document.getElementById('view_image').setAttribute('selected', true);
		}
	}
}

//function imageSize(path) {
//
//	var imgLoadSvc=Components.classes["@mozilla.org/image/loader;1"]
//		.getService();
//	var imgLoad=imgLoadSvc.QueryInterface(Components.interfaces.imgILoader);
//
//	var uriSvc=Components.classes["@mozilla.org/network/simple-uri;1"]
//		.getService();
//	var uri=uriSvc.QueryInterface(Components.interfaces.nsIURI);
//
//	var loadGroupSvc=Components.classes["@mozilla.org/network/load-group;1"]
//		.getService();
//	var loadGroup=loadGroupSvc.QueryInterface(Components.interfaces.nsILoadGroup);
//
//	var imgSvc=Components.classes["@mozilla.org/content/element/html;1?name=img"]
//		.getService();
//	var imgDecObs=imgSvc.QueryInterface(Components.interfaces.imgIDecoderObserver);
//	alert(imgDecObs);
//
//
////	for (i in Components.interfaces) {
////		try {
////			imgLoad.QueryInterface(Components.interfaces[i]);
////			dump(i +'\n');
////		} catch (e) {  }
////	}
//	
////	dump(imgSvc.loadImage+'\n');
//
//	uri.spec='file://'+path;
//
//	var imgReq=imgLoad.loadImage(
//		uri, uri, uri, loadGroup, imgDecObs, null, null, null, null
//	);
//
//	dump( imgReq +'\n');
//}

var overlayObserver={
	observe: function (aSubject, aTopic, aData) {
		if ('xul-overlay-merged'==aTopic) { // observe preference changes
			tinymenu.loadOptions();
		}
	},

	QueryInterface: function(aIID) {
		if(!aIID.equals(CI.nsISupports) && !aIID.equals(CI.nsIObserver)) {
			throw CR.NS_ERROR_NO_INTERFACE;
		}

		return this;
	}
};