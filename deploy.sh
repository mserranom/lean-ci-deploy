rm -rf app;
rm app.zip;
cp ../lean-ci/dist.zip ./app.zip;
unzip -qq app.zip -d app;
git add app;
git commit -am "updated app";
git push origin master;

