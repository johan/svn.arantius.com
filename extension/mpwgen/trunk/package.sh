#!/bin/sh
rm -f mpwgen.xpi
zip -9 mpwgen.xpi \
  `find . -type d -name .svn -prune -false -o -true -a -not -name '.svn'`
