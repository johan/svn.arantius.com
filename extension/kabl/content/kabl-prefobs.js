var gKablPrefObserver={
	_branch:null,

	register:function() {
		this._branch=gKablPref;
		this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this._branch.addObserver('', this, false);
	},

	unregister:function() {
		if (!this._branch) return;
		this._branch.removeObserver('', this);
	},

	observe:function(aSubject, aTopic, aData) {
		if(aTopic != 'nsPref:changed') return;
		// aSubject is the nsIPrefBranch we're observing (after appropriate QI)
		// aData is the name of the pref that's been changed (relative to aSubject)
		
		if ('enabled'==aData) {
			// load the new value
			gKablEnabled=gKablPref.getBoolPref('enabled');

			// propagate it to all the open windows
			var ifaces=Components.interfaces;
			var mediator=Components.classes["@mozilla.org/appshell/window-mediator;1"].
				getService(ifaces.nsIWindowMediator);
			var win,winEnum=mediator.getEnumerator('navigator:browser');
			while (winEnum.hasMoreElements()){
				win=winEnum.getNext();

				win.gKablEnabled=gKablEnabled;
				win.gKabl.setImage();
			}
		}
	}
}
gKablPrefObserver.register();