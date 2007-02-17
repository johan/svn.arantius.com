(function() {

var insertEvents=[];

function catchInsertEvent(event) {
	// just cache the event.  if we try to access the object, we screw things up 
	insertEvents[insertEvents.length]=event;
}

function mungeMenus(event) {
	document.removeEventListener('DOMNodeInserted', catchInsertEvent, true);
	window.removeEventListener('DOMContentLoaded', mungeMenus, true);

	var toolsMenu=
		document.getElementById('menu_ToolsPopup') || // firefox
		document.getElementById('taskPopup') ;        // thunderbird

	var moreToolsMenu=document.getElementById('more-tools-menupopup');

	var mungeFlag=false;

	// for each insert event, find the element, and decide
	// if we should do something with it
	for (var i=insertEvents.length-1, event=null, el=null; event=insertEvents[i]; i--) {
		try {
			el=event.target;

			if (toolsMenu!=el.parentNode) continue;
			// if we got here, the insert was to the tools menu.  move the element!
			toolsMenu.removeChild(el);
			moreToolsMenu.appendChild(el);

			mungeFlag=true;
		} catch (e) { }
	}

	if (mungeFlag) {
		// we did munge something into this menu; remove the label and separator
		document.getElementById('more-tools-label').setAttribute('hidden', true);
		document.getElementById('more-tools-sep').setAttribute('hidden', true);
	}
}

document.addEventListener('DOMNodeInserted', catchInsertEvent, true);
window.addEventListener('DOMContentLoaded', mungeMenus, true);


})();
