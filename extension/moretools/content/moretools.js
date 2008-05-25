(function() {
// At initial run, find and mark all the elements in the tools menu.
var toolsMenu=document.getElementById('menu_ToolsPopup');
var tools=toolsMenu.childNodes;
for (var i=0, t; t=tools[i]; i++) {
	t.setAttribute('moreToolsMark', '');
}

// Then, after the window has loaded, find and move any un-marked items.
function moveInitialTools() {
	window.removeEventListener('load', moveInitialTools, true);

	var moreToolsMenu=document.getElementById('more-tools-menupopup');
	var tools=document.getElementById('menu_ToolsPopup').childNodes;
	var mungeFlag=false;
	
	var moveTool=function(e) {
		if (e.target) e=e.target;

		toolsMenu.removeChild(e);
		moreToolsMenu.appendChild(e);		
		
		if (!mungeFlag) {
			document.getElementById('more-tools-label')
				.setAttribute('hidden', true);
		}
		mungeFlag=true;
	}

	for (var i=0, t; t=tools[i]; i++) {
		if (t.hasAttribute('moreToolsMark')) continue;
		moveTool(t);
	}

	// And move anything added later.
	toolsMenu.addEventListener('DOMNodeInserted', moveTool, true);
}
window.addEventListener('load', moveInitialTools, true);
})();
