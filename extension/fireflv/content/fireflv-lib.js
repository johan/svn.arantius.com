var gFireFlvVideoUrls=[
	'youtube.com/player2.swf'
];

function gFireFlvUrlIsForVideo(url) {
	if (!url.toLowerCase) return false;
	url=url.toLowerCase();

	for(var i=0, vidUrl=null; vidUrl=gFireFlvVideoUrls[i]; i++) {
		if (-1!==url.indexOf(vidUrl)) return i;
	}

	return false;
}
