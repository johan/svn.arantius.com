window.addEventListener('load', function(){
//find the main menu
var menubar=document.getElementById('main-menubar');
//find our menu popup
var menusub=document.getElementById('tinymenu-popup');

//move each of the menus into the sub menu
var el;
while (el=menubar.childNodes[0]) {
	if ('tinymenu'==el.id) break;

	menubar.removeChild(el);
	menusub.appendChild(el);
}

//put the new items in our menu popup
var menupop=document.getElementById('tinymenu');
menupop.appendChild(menusub);
}, false);