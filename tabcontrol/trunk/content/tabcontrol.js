var gTabControl={
/********************************* VARIABLES *********************************/

prefObj: Components.classes['@mozilla.org/preferences-service;1']
		.getService(Components.interfaces.nsIPrefBranch),

/****************************** EVENT LISTENERS ******************************/

onLoad:function() {
	//in options window, no getbrowser...
	if ('undefined'==typeof getBrowser) return;

	//attach other listeners
	window.addEventListener('unload', gTabControl.onUnLoad, false);

	//mangle removeTab function
	gBrowser.origRemoveTab=gBrowser.removeTab;
	gBrowser.removeTab=gTabControl.removeTab;
},

onUnLoad:function() {
	//remove our listeners
	window.removeEventListener('load', gTabControl.onLoad, false);
	window.removeEventListener('unload', gTabControl.onUnLoad, false);
},

onTabAdd:function(aEvent) {
	//eventually rearrange order here
},

removeTab:function(aTab) {
	var tabToSelect=null;
	var focusMode=gTabControl.getPref('int', 'extensions.tabcontrol.focusTab', 0);

	//if we're set to, focus left tab
	if (0==focusMode && aTab._tPos>0) {
		tabToSelect=gBrowser.mTabContainer.childNodes[aTab._tPos-1];
	}

	//call the browser's real remove tab function
	gBrowser.origRemoveTab(aTab);

	//skip the rest if we don't need to focus a custom tab
	if (null==tabToSelect) return;
	
	//set focus to the tab that we want
	with (gBrowser) {
		selectedTab=tabToSelect;
		mTabBox.selectedPanel=getBrowserForTab(mCurrentTab).parentNode;
		mCurrentTab.selected = true;
		updateCurrentBrowser();
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
	alert('tabcontrol test!\n');
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
