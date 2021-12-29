#!/bin/bash

./node_modules/.bin/jsdoc ./ -r -c ./bin/jsdoc-config.json --readme ./README.md -p -d ./docs/page -t ./node_modules/docdash
