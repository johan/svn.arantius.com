var tabcontrol={
test:function() {
	alert('tabcontrol test!');
},

getPref:function(type, name) {
	try {
		switch(type) {
		case 'bool':   return this.prefObj.getBoolPref(name);
		case 'int':    return this.prefObj.getIntPref(name);
		case 'string':
		default:       return this.prefObj.getCharPref(name); 
		}
	} catch (e) { this.dumpErr(e) }
	return '';
},

setPref:function(type, name, value) {
	try {
		switch (type) {
		case 'bool':   this.prefObj.setBoolPref(name, value); break;
		case 'int':    this.prefObj.setIntPref(name, value); break;
		case 'string':
		default:       this.prefObj.setCharPref(name, value); break;
		}
	} catch (e) { this.dumpErr(e) }
},

loadOptions:function() {
	try {
	//window.document.getElementById('uppity-sb-icon').checked=this.getPref('bool', 'uppity.sb-icon');
	} catch (e) { this.dumpErr(e) }
	return true;
},

saveOptions:function() {
	try {
	//this.setPref('bool', 'uppity.sb-icon',
	//	Boolean(window.document.getElementById('uppity-sb-icon').checked)
	//);
	} catch (e) { this.dumpErr(e) }
	return true;
},

dumpErr:function(e) {
	var s='Error in tabcontrol:  ';
	s+='Line: '+e.lineNumber+'  ';
	s+=e.name+': '+e.message+'\n';
	dump(s);
},

}//close object tabcontrol


window.addEventListener('load', function() {

tabcontrol.prefObj=Components.classes['@mozilla.org/preferences-service;1']
	.getService(Components.interfaces.nsIPrefBranch);

}, false); // end window.addEventListener('load'...)
