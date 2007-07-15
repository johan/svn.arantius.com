window.addEventListener('load', function() {
	document.getElementById("appcontent")
		.addEventListener('DOMContentLoaded', gFireFlvDomLoad, false);
}, false);

function gFireFlvDomLoad(event) {
	var contentDoc=event.target;

	var src=null, domain=null;

	var set=contentDoc.getElementsByTagName('embed');
	for (var i=0, item=null; item=set[i]; i++) {
		var src=item.getAttribute('src').toLowerCase();
		if (!src) continue;
		if ('http'!=src.substring(0, 4)) src=contentDoc.location.host+src;

		domain=gFireFlvUrlIsForVideo(src);
		if (false!==domain) {
			gFireFlvRewireVideo(domain, src, item);
			break;
		}
	}

	var set=contentDoc.getElementsByTagName('object');
	for (var i=0, item=null; item=set[i]; i++) {
		var src=item.getAttribute('data');
		if (!src) continue;
		if ('http'!=src.substring(0, 4)) src=contentDoc.location.host+src;

		domain=gFireFlvUrlIsForVideo(src);
		if (false!==domain) {
			gFireFlvRewireVideo(domain, src, item);
			break;
		}
	}

	var set=contentDoc.getElementsByTagName('param');
	for (var i=0, item=null; item=set[i]; i++) {
		if ('movie'!=item.getAttribute('name')) continue;

		var src=item.getAttribute('value');
		if (!src) continue;
		if ('http'!=src.substring(0, 4)) src=contentDoc.location.host+src;

		domain=gFireFlvUrlIsForVideo(src);
		if (false!==domain) {
			gFireFlvRewireVideo(domain, src, item);
			break;
		}
	}
}

function gFireFlvRewireVideo(domain, src, el) {
	dump('FireFlv rewire: ['+domain+'] '+src+'\n');

	if ('OBJECT'==el.tagName) {

	}
}
