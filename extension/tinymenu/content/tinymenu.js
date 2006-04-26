window.addEventListener('load', function(){
//find the main menu
var menubar=document.getElementById('main-menubar');
//create our sub menu
var menusub=document.createElement('menupopup');

//move each of the menus into the sub menu
var el;
while (el=menubar.childNodes[0]) {
	menubar.removeChild(el);

	menusub.appendChild(el);
}

//create the main popup and put the sub menu in it
var menupop=document.createElement('menu');
menupop.setAttribute('id', 'tinymenu');
menupop.setAttribute('label', 'Menu');
menupop.setAttribute('accesskey', 'm');
menupop.appendChild(menusub);

//put the popup menu in the menu bar
menubar.appendChild(menupop);
}, false);