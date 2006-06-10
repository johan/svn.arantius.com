(function() {

function flagInsertedElement(event) {
	try {
		var el=event.target;
		// if this thing wasn't in the tools menu, forget it
		if ('menu_ToolsPopup'!=el.parentNode.id) return;
		// but if it was, flag it to get moved later
		el.setAttribute('more-tools-to-move', true);
	} catch (e) {
		//dump('Error! '+e+'\n');
	}
}

function mungeMenus(event) {
	// clean up event listeners
	document.removeEventListener('DOMNodeInserted', flagInsertedElement, true);
	window.removeEventListener('DOMContentLoaded', mungeMenus, true);

	// grab references for 'from' and 'to' points
	var toolsMenu=document.getElementById('menu_ToolsPopup');
	var moreToolsMenu=document.getElementById('more-tools-menupopup');

	// find all the elements we flagged on insert
	var elsToMove=document.getElementsByAttribute('more-tools-to-move', true);
	// and for each one, move it
	for (var i=0, el=null; el=elsToMove[i]; i++) {
		try {
			moreToolsMenu.appendChild(el);
			toolsMenu.removeChild(el);
			el.removeAttribute('more-tools-to-move');
		} catch (e) {
			//dump('Error! '+e+'\n');
		}
	}
}

document.addEventListener('DOMNodeInserted', flagInsertedElement, false);
window.addEventListener('DOMContentLoaded', mungeMenus, false);

})();
