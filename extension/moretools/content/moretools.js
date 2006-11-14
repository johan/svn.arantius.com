(function() {

// hold early movers until the window is done loading .. that's the only point
// at which we can be sure the new menu exists to be moved into
var earlyMoverCache=[];

// cache these lookups
var toolsMenu=
	document.getElementById('menu_ToolsPopup') || // firefox
	document.getElementById('taskPopup') ;        // thunderbird
// this one will almost certainly fail.  we'll deal with that gracefully later
var moreToolsMenu=document.getElementById('more-tools-menupopup');

var toolFlag=false;

function catchInsertEvent(event) {
	try {
		el=event.target;
	} catch (e) {
		dump('More tools error:\n'+e+'\n');
		return;
	}

	if (!moreToolsMenu || !toolsMenu) {
		earlyMoverCache.push(el);
	} else {
		moveTool(el);
	}
}

function moveTool(el) {
	try {
		// only move things if they came from the tools menu
		if (toolsMenu!=el.parentNode) return;

		// if we got here, the insert was to the tools menu.  move the element!
		toolsMenu.removeChild(el);
		moreToolsMenu.appendChild(el);

		if (!toolFlag) {
			// if this was the first one...
			try {
				document.getElementById('more-tools-label').setAttribute('hidden', true);
				document.getElementById('more-tools-sep').setAttribute('hidden', true);
			} catch (e) {  }
		}
		toolFlag=true;
	} catch (e) {
		dump('More tools error:\n'+e+'\n');
	}
}

function flushEarlyMovers() {
	window.removeEventListener('DOMContentLoaded', flushEarlyMovers, false);

	// rebuild, in case early lookups failed
	if (!toolsMenu) {
		toolsMenu=
			document.getElementById('menu_ToolsPopup') || // firefox
			document.getElementById('taskPopup') ;        // thunderbird
	}
	if (!moreToolsMenu) {
		moreToolsMenu=document.getElementById('more-tools-menupopup');
	}

	// now we can move, safely
	for (var i=0, el=null; el=earlyMoverCache[i]; i++) {
		moveTool(el);
	}

	// empty out the cache, save some memory
	earlyMoverCache.length=0;

	// if there was an earlier run, it probably failed this.  try again in case.
	if (toolFlag) {
		document.getElementById('more-tools-label').setAttribute('hidden', true);
		document.getElementById('more-tools-sep').setAttribute('hidden', true);
	}
}

document.addEventListener('DOMNodeInserted', catchInsertEvent, false);
window.addEventListener('DOMContentLoaded', flushEarlyMovers, false);
})();
