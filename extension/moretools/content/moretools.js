(function() {

var insertEvents=[];

function catchInsertEvent(event) {
	// just cache the event.  if we try to access the object, we screw things up 
	insertEvents[insertEvents.length]=event;
}

function mungeMenus(event) {
	document.removeEventListener('DOMNodeInserted', catchInsertEvent, true);
	window.removeEventListener('DOMContentLoaded', mungeMenus, true);

	var toolsMenu=document.getElementById('menu_ToolsPopup');
	var moreToolsMenu=document.getElementById('more-tools-menupopup');

	// for each insert event, find the element, and decide
	// if we should do something with it
	for (var i=0, el=null; el=insertEvents[i].target; i++) {
		if (toolsMenu!=el.parentNode) continue;
		// if we got here, the insert was to the tools menu.  move the element!
		toolsMenu.removeChild(el);
		moreToolsMenu.appendChild(el);
	}
}

document.addEventListener('DOMNodeInserted', catchInsertEvent, true);
window.addEventListener('DOMContentLoaded', mungeMenus, true);


})();