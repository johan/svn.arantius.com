(function() {
// At initial run, find and mark all the elements in the tools menu.
var toolsMenu=
	document.getElementById('menu_ToolsPopup') || // firefox
	document.getElementById('taskPopup') ;        // thunderbird
var tools=toolsMenu.childNodes;
for (var i=0, t; t=tools[i]; i++) {
	t.setAttribute('moreToolsMark', '');
}

// Then, after the window has loaded, find and move any un-marked items.
window.addEventListener('load', function() {
	var moreToolsMenu=document.getElementById('more-tools-menupopup');
	var tools=document.getElementById('menu_ToolsPopup').childNodes;
	var mungeFlag=false;
	
	var moveTool=function(el) {
		toolsMenu.removeChild(el);
		moreToolsMenu.appendChild(el);		
		mungeFlag=true;
	}

	for (var i=0, t; t=tools[i]; i++) {
		if (t.hasAttribute('moreToolsMark')) continue;

		dump('more tools move: '+i+' '+t+'\n');
		moveTool(t);
	}

}, true);
})();
