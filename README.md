#Overview

Sojobs scans the jobs from the monthly hacker news "who is hiring" thread and loads them into a database, and makes them available for searching, by city, key word, visa or remote option.

#Prerequesites

* install node 4.x+, npm and grunt
* install a recent version of postgres. This app use full text search and point data types that are specific to postgres
* install the lb-ng loopback utility described in https://docs.strongloop.com/display/public/LB/AngularJS+JavaScript+SDK#AngularJSJavaScriptSDK-lb-ngcommand

#Configuration

* git clone http://github.com/drorm/sojobs
* for each of the following copy the config files and adjust the credentials, email addresses, server names, etc
 * cp server/config.sample.json  server/config.json
  * host
  * port
 * cp server/sparrowConfig.sample.js  server/sparrowConfig.js 
  * initAdmin -- this is the admin of the app. 
   * email
   * password
   * first
   * last
  * emailFrom -- which user are notifications like email verification are coming from
 * cp server/datasources.local.sample.js  server/datasources.local.js
  * db -- database credentials
  * mail/smtp -- for email verification when users sign up

#Build
* cd jobs
* npm install
* grunt. This will also do the following:
 * cd client
  * npm install
  * grunt
* If you're going to make changes to the client javascript, you should run the following so it builds the concatenated file
 * grunt watch

#Db setup
* psql jobs jobs < server/db/schema.sql
* psql jobs jobs < server/db/cities.sql


# Other
* set up Google places for the auto complete: https://console.developers.google.com/apis/credentials?project=job-search-tryx
* SSL cert via let's encrypt https://github.com/Daplie/node-letsencrypt

#Run

#Run directly
* node server/fetchData/fetch.js -- fetches the jobs listings from Hacker News
* node server/server.js -- this is the main node/express/loopback.js app

#Use pm2
Use the pm2 process manager, http://pm2.keymetrics.io/

* run node\_modules/.bin/pm2 start ecosystem.json 
* logs go into ~/.pm2/logs

This will start two apps:
* server/server.js -- this is the main node/express/loopback.js app
* server/fetchData/fetch.js -- fetches the jobs listings from Hacker News


