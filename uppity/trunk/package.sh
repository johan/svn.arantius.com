#!/bin/sh
rm -f uppity.xpi
zip -9 uppity.xpi \
  install.rdf \
  `find chrome -type d -name .svn -prune -false -o -true -a -not -name '.svn'`
