(function() {

var toolsMenu=document.getElementById('menu_ToolsPopup');
var toolsEls=[];

function catchToolsInsert(event) {
	var el=event.target;
	if (el.parentNode==toolsMenu) {
		toolsEls[toolsEls.length]=el;
		toolsMenu.removeChild(el);
	}
}
function insertCaughtElements() {
	var moreToolsMenu=document.getElementById('more-tools-menupopup');

	// remove els from tools, ignore su
	for (var i=0; toolsEls[i]; i++) {
		moreToolsMenu.appendChild(toolsEls[i]);
	}
	toolsEls.length=0;
}

toolsMenu.addEventListener('DOMNodeInserted', catchToolsInsert, true);
window.addEventListener('DOMContentLoaded', insertCaughtElements, true);

})();