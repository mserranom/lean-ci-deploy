#!/usr/bin/env bash



rm -rf app;
rm app.zip;
cp ../lean-ci/dist.zip ./app.zip;
unzip -qq app.zip -d app;
rm app.zip;

#git add app;
#git commit -am "updated app";
#git push origin master;


tar -pczf app.tar.gz app

curl -n -X POST https://api.heroku.com/apps/leanci/sources -H 'Accept: application/vnd.heroku+json; version=3'

CONF=`cat config.json | base64`
CMD="heroku config:set LEANCI_CONFIG="$CONF" --app leanci"
$CMD

