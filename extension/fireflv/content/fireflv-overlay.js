window.addEventListener('load', function() {
	document.getElementById("appcontent")
		.addEventListener('DOMContentLoaded', gFireFlvDomLoad, false);
}, false);

function gFireFlvDomLoad(event) {
	var contentDoc=event.target;

	var src=null, domain=null;

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

		dump('param: '+item+' '+src+'\n');

		domain=gFireFlvUrlIsForVideo(src);
		if (false!==domain) {
			gFireFlvRewireVideo(domain, src, item);
			break;
		}
	}

	var set=contentDoc.getElementsByTagName('embed');
	for (var i=0, item=null; item=set[i]; i++) {
		var src=item.getAttribute('src');
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
	dump('FireFlv rewire: ['+domain+'] '+src+' '+el.tagName+'\n');

	var preview=null, flv=null;

	switch (domain) {
	case 0: //youtube
	case 1: //youtube
		var id=src.match(/(\/v\/|video_id=)([^&]*)/);
		if (!id || !id[2]) return;

		id=id[2];

		//http://img.youtube.com/vi/q-O7Nteshv4/default.jpg
		preview='http://img.youtube.com/vi/'+id+'/default.jpg';
		flv='http://cache.googlevideo.com/get_video?video_id='+id;
		break;
	}

	if (flv) {
		//var newUrl='chrome://fireflv/content/flvplayer.swf'+
		var newUrl='http://arantius.googlepages.com/flvplayer.swf'+
			'?file='+escape(flv)+
//			'&width='+oldVideo.getAttribute('width')+
//			'&height='+oldVideo.getAttribute('height')+
//			'&showdownload=true'+
//			'&autostart=false'+
//			'&volume=50'
			''
		;
		dump('New SWF url: '+newUrl+'\n');

		if ('OBJECT'==el.tagName) {
			var params=el.getElementsByTagName('param');
			while (params[0]) el.removeChild(params[0]);

			el.setAttribute('data', newUrl);
		} else if ('EMBED'==el.tagName) {
			el.removeAttribute('flashvars');
			el.setAttribute('src', newUrl);
		}
	}
}
