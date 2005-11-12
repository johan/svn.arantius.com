var gTabControl={
/********************************* VARIABLES *********************************/

prefObj: Components.classes['@mozilla.org/preferences-service;1']
		.getService(Components.interfaces.nsIPrefBranch),
//initialized onload
tabCont: null, 

/****************************** EVENT LISTENERS ******************************/

onLoad:function() {
	//in options window, no getbrowser...
	if ('undefined'==typeof getBrowser) return;

	gTabControl.tabCont=getBrowser().mTabContainer;

	//attach other listeners
	window.addEventListener('unload', gTabControl.onUnLoad, false);
	gTabControl.tabCont.addEventListener('DOMNodeInserted', gTabControl.onTabAdd, false);
	gTabControl.tabCont.addEventListener('DOMNodeRemoved', gTabControl.onTabClose, false);
},

onUnLoad:function() {
	//remove our listeners
	window.removeEventListener('load', gTabControl.onLoad, false);
	window.removeEventListener('unload', gTabControl.onUnLoad, false);
	gTabControl.tabCont.removeEventListener('DOMNodeInserted', gTabControl.onTabAdd, false);
	gTabControl.tabCont.removeEventListener('DOMNodeRemoved', gTabControl.onTabClose, false);
},

//this function traps the case where we are adding a new tab
//if prefs set to do so, then we move the new tab into a new place
onTabAdd:function(aEvent) {
	//eventually rearrange order here
},

//this function traps the case where we are closing the current tab
//and sets the proper new selected tab
onTabClose:function(aEvent) {
	var tab=aEvent.target;

	if (getBrowser().mCurrentTab._tPos!=tab._tPos) {
		//whichever tab we removed was not the currently 
		//selected one so no special case
		return;
	}

	//for (i in tab) try { dump(i+'\t'+tab[i]+'\n'); }catch(e){}

	//if we're set to, focus left tab
	if (0==gTabControl.getPref('int', 'extensions.tabcontrol.focusTab', 0)) {
		//if we're closing the first tab, there is no left tab
		if (0==tab._tPos) return;
		window.getBrowser().selectedTab=gTabControl.tabCont.childNodes[tab._tPos-1];
	}
},

/******************************** PREFERENCES ********************************/

getPref:function(aType, aName, aDefault) {
	try {
		switch(aType) {
		case 'bool':   return this.prefObj.getBoolPref(aName);
		case 'int':    return this.prefObj.getIntPref(aName);
		case 'string':
		default:       return this.prefObj.getCharPref(aName); 
		}
	} catch (e) { 
		return(aDefault);
	}
	return '';
},

setPref:function(aType, aName, aValue) {
	try {
		switch (aType) {
		case 'bool':   this.prefObj.setBoolPref(aName, aValue); break;
		case 'int':    this.prefObj.setIntPref(aName, aValue); break;
		case 'string':
		default:       this.prefObj.setCharPref(aName, aValue); break;
		}
	} catch (e) {  }
},

loadOptions:function() {
	try {
		window.document.getElementById('focusTab').selectedIndex=
			gTabControl.getPref('int', 'extensions.tabcontrol.focusTab', 0);
	} catch (e) {  }
	return true;
},

saveOptions:function() {
	try {
		gTabControl.setPref('int', 'extensions.tabcontrol.focusTab',
			window.document.getElementById('focusTab').selectedIndex
		);		
	} catch (e) {  }
	return true;
},

/********************************* DEBUGGING *********************************/

test:function() {
	alert('tabcontrol test!\n'+this.tabCont);
},

dumpErr:function(e) {
	var s='Error in tabcontrol:  ';
	s+='Line: '+e.lineNumber+'  ';
	s+=e.name+': '+e.message+'\n';
	dump(s);
},

}//close object gTabControl

//add listener for onload handler
window.addEventListener('load', gTabControl.onLoad, false);
