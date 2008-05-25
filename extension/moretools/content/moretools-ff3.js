(function() {

// duplicate original window (drastic, but anything else either prevents node insertion or throws an exception)
var originalWindow = document.lastChild.cloneNode(true);

function mungeMenus(event) {
	window.removeEventListener('DOMContentLoaded', mungeMenus, true);

	var toolsMenu=
		document.getElementById('menu_ToolsPopup') || // firefox
		document.getElementById('taskPopup') ;        // thunderbird

	var moreToolsMenu=document.getElementById('more-tools-menupopup');

	// Find the original tools menu popup
	var originalMenuPopups = originalWindow.getElementsByTagName("menupopup");
	var originalToolsMenu=null;
	for (i=0; i<originalMenuPopups.length; i++) {
		if (originalMenuPopups[i].id == "menu_ToolsPopup" || // firefox
		    originalMenuPopups[i].id == "taskPopup") {       // thunderbird
			originalToolsMenu = originalMenuPopups[i];
		}
	}
	originalMenuPopups = null;
		
	var mungeFlag=false;
	
	// function to move menu item from tools menu to more tools menu
	var moveElem = function(el) {
		toolsMenu.removeChild(el);
		moreToolsMenu.appendChild(el);
		
		mungeFlag=true;
	}
	
	// loop through the original menu toolbar and the current menu toolbar.  Move anything
	// that's in the current one that wasn't there originally
	var i=0;
	for (j=0; j<originalToolsMenu.childNodes.length; j++) {
		while ((originalToolsMenu.childNodes[j].id != toolsMenu.childNodes[i].id) &&
				 (originalToolsMenu.childNodes[j].id != toolsMenu.childNodes[i].id)) {
		
			moveElem(toolsMenu.childNodes[i]);
		}
		i++;
	}
	
	// Move remaining menu items from tools menu
	while (i < toolsMenu.childNodes.length) {
		moveElem(toolsMenu.childNodes[i]);
	}		
   
	// don't need cloned window any more so get rid of it 
	originalToolsMenu = null;
	originalWindow = null;

	if (mungeFlag) {
		// we did munge something into this menu; remove the label and separator
		document.getElementById('more-tools-label').setAttribute('hidden', true);
		document.getElementById('more-tools-sep').setAttribute('hidden', true);
	}
}


window.addEventListener('DOMContentLoaded', mungeMenus, true);


})();
