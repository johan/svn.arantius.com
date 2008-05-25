(function() {
var orgDocument=document.lastChild.cloneNode(true);
orgDocument.getElementById=document.getElementById;

function mungeMenus(event) {
	window.removeEventListener('DOMContentLoaded', mungeMenus, true);

	var toolsMenu=
		document.getElementById('menu_ToolsPopup') || // firefox
		document.getElementById('taskPopup') ;        // thunderbird
	var moreToolsMenu=document.getElementById('more-tools-menupopup');

	var orgMenuPopups=orgDocument.getElementsByTagName("menupopup");
	var orgToolsMenu=null;
	for (var i=0, popup=null; popup=orgMenuPopups[i]; i++) {
		if (popup.id=="menu_ToolsPopup" || // firefox
		    popup.id=="taskPopup"          // thunderbird
		) {
			orgToolsMenu=orgMenuPopups[i];
		}
	}

	var mungeFlag=false;
	var moveTool=function(e) {
		if (e.target) e=e.target;

		toolsMenu.removeChild(e);
		moreToolsMenu.appendChild(e);

		if (!mungeFlag) {
			document.getElementById('more-tools-label').setAttribute('hidden', true);
			document.getElementById('more-tools-sep').setAttribute('hidden', true);
		}
		mungeFlag=true;
	}

	function nodeWasInOrgMenu(node) {
		for (var i=0, orgNode=false; orgNode=orgToolsMenu.childNodes[i]; i++) {
			if (node.isEqualNode(orgNode)) return true;
		}
		return false;
	}

	for (var i=0, node=false; node=toolsMenu.childNodes[i]; i++) {
		if (!nodeWasInOrgMenu(node)) {
			moveTool(node);
		}
	}

	// Free this memory.
	orgDocument=null;
	orgToolsMenu=null;
	orgMenuPopups=null;

	// Move any node added in the future.
	toolsMenu.addEventListener('DOMNodeInserted', moveTool, true)
}
window.addEventListener('DOMContentLoaded', mungeMenus, true);
})();
