var gVideoUrls=[
	'metacafe.com',
	'revver.com',
	'video.google.com',
	'yimg.com',
	'youtube.com/player2.swf'
];

function urlIsForVideo(url) {
	if (!url.toLowerCase) return false;
	url=url.toLowerCase();

	for(var i=0, vidUrl=null; vidUrl=gVideoUrls[i]; i++) {
		if (-1!==url.indexOf(vidUrl)) return true;
	}

	return false;
}
