#!/bin/bash

PROJ=`sed '2,$d' chrome.manifest|awk '{print $2}'`

sed '/^locale/d' chrome.manifest > tmp

for lang in `ls locale`; do
	echo "locale ${PROJ} ${lang} locale/${lang}/" >> tmp
done

mv tmp chrome.manifest
