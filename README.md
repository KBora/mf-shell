# Microfrontend with Angular and Module Federation POC

## Create the shell application
* Create application using Angular CLI v14  `ng new mf-shell`
  * Choose Y for routing and SCSS for CSS 
* Create header component and display in the main app component
* Use plugin to setup module federation `ng add@angular-architects/module-federation --host` This plugin does the following:
  * Replace the default Angular builder with `ngx-build-plus` , see angular.json > projects.PROJECT-NAME.architect.build.builder
  * Add extraWebpackConfig option, see angular.json - projects.PROJECT-NAME.architect.build.options.
  * Create webpack.config.js / webpack.prod.config.js. Note this is a partial webpack configuration that works alongside the default Angular CLI webpack configuration
  * TODO: Manually configure remote in webpack.config.js file - do this once the remoate is setup (ie. you know the localhost port or the server the remote is hosted on)
* Running the shell app (`npm run start`) will run the application like a standard Angular application as no remotes are configured - there is a JavaScript error however `Uncaught SyntaxError: Cannot use 'import.meta' outside a module`
  
## Create the remote application
* Create application using Angular CLI v14 `ng new mf-remote1 --create-application false`
  * Using the --create-application false flag this time as I want the remote to have a multiple projects
* Create account-master project `ng g application account-master --routing --style scss` 
* Create accounts-list component `ng g c accounts-list --project account-master`
* 
* Run the application `npm run start` 
