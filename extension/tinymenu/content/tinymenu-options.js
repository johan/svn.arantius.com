const FIREFOX_ID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";
const THUNDERBIRD_ID = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";

function loadOverlay(event) {
	var appInfo=Components.classes["@mozilla.org/xre/app-info;1"]
		.getService(Components.interfaces.nsIXULAppInfo);

	if (FIREFOX_ID==appInfo.ID) {
		// the label changed, so show the proper one
		var versionChecker=Components
			.classes["@mozilla.org/xpcom/version-comparator;1"]
			.getService(Components.interfaces.nsIVersionComparator);
		if (versionChecker.compare(appInfo.version, "2.0") >= 0) {
			document.loadOverlay('chrome://tinymenu/content/tinymenu-options-ff2.xul', overlayObserver);
		} else {
			document.loadOverlay('chrome://tinymenu/content/tinymenu-options-ff1.xul', overlayObserver);
		}

		// the label changed, but not the ID, so always these IDs for firefox
		tinymenu.menuIds=[
			'file-menu', 'edit-menu', 'view-menu', 'go-menu',
			'bookmarks-menu', 'tools-menu', 'helpMenu'
		];
	} else if (THUNDERBIRD_ID==appInfo.ID) {
		document.loadOverlay('chrome://tinymenu/content/tinymenu-options-tb.xul', overlayObserver);

		tinymenu.menuIds=[
			'menu_File', 'menu_Edit', 'menu_View', 'menu_Go',
			'messageMenu', 'tasksMenu', 'menu_Help'
		];
	} else {
		// another app ??
	}
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

			tinymenu.activateViewMode();
		}
	}
}

function resetImage() {
	tinymenu.iconFile='chrome://tinymenu/skin/tinymenu.png';
	tinymenu.activateViewMode();
}

function setViewMode(mode) {
	tinymenu.activateViewMode(mode);
}

var overlayObserver={
	observe: function (aSubject, aTopic, aData) {
		if ('xul-overlay-merged'==aTopic) {
			tinymenu.loadOptions();
			window.sizeToContent();
		}
	},

	QueryInterface: function(aIID) {
//		// ???  This came from the example, but CI is not defined!
//		if(!aIID.equals(CI.nsISupports) && !aIID.equals(CI.nsIObserver)) {
//			throw CR.NS_ERROR_NO_INTERFACE;
//		}
		return this;
	}
};

// calling at DOMContentLoaded instead of load has the convenient side effect
// of avoiding the collision with CuteMenus, for me at least
window.addEventListener('DOMContentLoaded', loadOverlay, true);
