(function() {

var toolsMenuPopup;
var moreToolsMenuPopup;
var origTools=getTools(document);

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function getTools(node) {
	function nsResolver() {
		return 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
	}

	var doc=node.ownerDocument || node;

	var nodesSnapshot=doc.evaluate(
		"//xul:menupopup[@id='menu_ToolsPopup' or @id='taskPopup']/*",
		doc, nsResolver, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
	);

	return nodesSnapshot;

	var result=[];
	for (var i=0; i<nodesSnapshot.snapshotLength; i++) {
		result.push( nodesSnapshot.snapshotItem(i) );
	}

	return result;
}

function moveAllTools() {
	var mungeFlag=false;
	var currTools=getTools(document);
	for (var i=0; i<currTools.snapshotLength; i++) {
		var el=currTools.snapshotItem(i);
		if (!el.hasAttribute('nativeTool')) {
			if ('menuseparator'==el.tagName) {
				toolsMenuPopup.removeChild(el);
			} else {
				moreToolsMenuPopup.appendChild(el);
			}
			mungeFlag=true;
		}
	}
	if (mungeFlag) {
		document.getElementById('more-tools-label').setAttribute('hidden', true);
		document.getElementById('more-tools-sep').setAttribute('hidden', true);
	}
}

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

window.addEventListener('load', function() {
	// Look up nodes now that getElementById() is safe.
	toolsMenuPopup=
		document.getElementById('menu_ToolsPopup') || // firefox
		document.getElementById('taskPopup');         // thunderbird
	moreToolsMenuPopup=document.getElementById('more-tools-menupopup');

	// Mark all tools items that were originally here.
	for (var i=0; i<origTools.snapshotLength; i++) {
		var el=origTools.snapshotItem(i);
		el.setAttribute('nativeTool', 'true');
	}
	origTools=null;

	// Move any non-marked tools that are already present.
	moveAllTools();

	// Move any non-marked tool that are added later.
	toolsMenuPopup.addEventListener('DOMNodeInserted', moveAllTools, true);
}, true);

})();
