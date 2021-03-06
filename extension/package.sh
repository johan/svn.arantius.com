#!/bin/sh

[ ! -f "chrome.manifest" ] && echo "Must execute from main extension directory!" && exit

# derive project name and version
PROJ=`awk '/^content/{print $2}' chrome.manifest | head -n 1`
rm -f ${PROJ}*.xpi
VER=`sed -n -e '/em:version/{s/[^0-9.]//g;p}' install.rdf`

echo BUILDING...

rm -fr build
mkdir build

# make build tree
find . -name '.svn' -prune -false -o -name 'build' -prune -false -o \
	-type d -not -name '.svn' -a -not -name 'build'  -a -not -name '.' \
	-exec mkdir "build/{}" \;
# copy files in
find -L . -name '.svn' -prune -false -o -name 'build' -prune -false -o \
	-type f -not -name 'package.sh' \
	-exec cp "{}" "build/{}" \;

cd build

# create the jar, patch the manifest to reference it
echo CREATING: "${PROJ}.jar"

sed -e "s/^content  *\([^ ]*\)  *\([^ ]*\)/content \1 jar:chrome\/${PROJ}.jar!\/\2/" \
	-e "s/skin  *\([^ ]*\)  *\([^ ]*\)  *\([^ ]*\)/skin \1 \2 jar:chrome\/${PROJ}.jar!\/\3/" \
	-e "s/locale  *\([^ ]*\)  *\([^ ]*\)  *\([^ ]*\)/locale \1 \2 jar:chrome\/${PROJ}.jar!\/\3/" \
	chrome.manifest > chrome.manifest.jar
mv chrome.manifest.jar chrome.manifest

find content/ skin/ locale/ | \
	zip -r -0 -@ "${PROJ}.jar" > /dev/null
rm -fr content/ skin/ locale/
mkdir chrome
mv "${PROJ}.jar" chrome

# remove files that shouldn't go in the xpi
echo "Removing unwanted files ..."
rm -f components/*.idl

# zip together the jar and the rest into the xpi
echo CREATING: "${PROJ}-${VER}.xpi"
zip -r -9 "../${PROJ}-${VER}.xpi" * > /dev/null

cd ..
rm -rf build/
