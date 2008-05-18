window.addEventListener('load', function(){
	//find the main menu
	var menubar=document.getElementById('main-menubar');
	//create our sub menu
	var menusub=document.getElementById('micromenu-pop');

	//move each of the menus into the sub menu
	var el;
	while (el=menubar.childNodes[1]) {
		menubar.removeChild(el);
		menusub.appendChild(el);
	}
}, false);
