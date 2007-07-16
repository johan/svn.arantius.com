var gFireFlvVideoUrls=[
	'youtube.com/player2.swf',
	'youtube.com/v/'
];
var gFireFlvVideoDomains=[
	'cache.googlevideo.com'
];

function gFireFlvUrlIsForVideo(url) {
	if (!url.toLowerCase) return false;
	url=url.toLowerCase();

	for(var i=0, vidUrl=null; vidUrl=gFireFlvVideoUrls[i]; i++) {
		if (-1!==url.indexOf(vidUrl)) return i;
	}

	return false;
}

function gFireFlvIsVideoXDomain(url) {
	if (!url.toLowerCase) return false;
	url=url.toLowerCase();

	for(var i=0, domain=null; domain=gFireFlvVideoDomains[i]; i++) {
		if ('http://'+domain+'/crossdomain.xml'==url) return true;
	}

	return false;
}
