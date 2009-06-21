(function() {

var toolsMenuPopup=
	document.getElementById('menu_ToolsPopup') || // firefox
	document.getElementById('taskPopup');         // thunderbird
var moreToolsMenuPopup;
var mungeFlag;

function moveTool(el) {
	moreToolsMenuPopup.appendChild(el);
	mungeFlag=true;
}

function moveAllTools() {
	var mungeFlag=false;
	for (var i=0, el=null; el=toolsMenuPopup.childNodes[i]; i++) {
		if (!el.hasAttribute('nativeTool')) {
			moveTool(el);
		}
	}
	if (mungeFlag) hideDescription();
}

function hideDescription() {
	document.getElementById('more-tools-label').setAttribute('hidden', true);
}

// Mark all tools items that are already here.
for (var i=0, el=null; el=toolsMenuPopup.childNodes[i]; i++) {
	el.setAttribute('nativeTool', 'true');
}

window.addEventListener('load', function() {
	// At load time, find the more-tools menu.
	moreToolsMenuPopup=document.getElementById('more-tools-menupopup');
	// Move any non-marked tools that are already present.
	moveAllTools();
	// Move any non-marked tool that are added later.
	toolsMenuPopup.addEventListener('DOMNodeInserted', moveAllTools, true);
}, true);

})();
