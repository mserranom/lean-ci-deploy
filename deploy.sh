rm -rf app;
rm app.zip;
cp ../lean-ci/dist.zip ./app.zip;
unzip -qq app.zip -d app;
rm app.zip;
git add app;
git commit -am "updated app";
git push origin master;

