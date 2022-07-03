# Microfrontend with Angular and Module Federation POC
Webpack 5's Module Federation feature is what makes this microfrontend architecture possible. Module Federation enables a remote module to be generated (eg remoteEntry.js) which can then be loaded dynamically by a shell/container at runtime. This is generated in addition to standard output (eg main.js) so the application can work standlone as well within the shell application. No meta microfrontend framework is required (for example single-spa).
This POC uses the @angular-architect/module-federation plugin which makes it easier to add the necessary module federation configuration and has some nice methods which enable dynamic loading of remotes. 

## Create the shell application
* Create application using Angular CLI v14  
  * `ng new mf-shell`
  * Choose Y for routing and SCSS for CSS 
* Create header component and display in the main app component
* Install module federation plugin (14.3.9) 
  * `npm i @angular-architects/module-federation`
* Use plugin to setup module federation 
  * `ng add @angular-architects/module-federation` 
  * The command does the following:
    * Replace the default Angular builder with `ngx-build-plus` , see angular.json > projects.PROJECT-NAME.architect.build.builder
    * Add extraWebpackConfig and commonChunk false option, see angular.json - projects.PROJECT-NAME.architect.build.options.
    * Create webpack.config.js / webpack.prod.config.js. Note this is a partial webpack configuration that works alongside the default Angular CLI webpack configuration
    * Update main.js to load from a bootstrap.ts file (not sure why this is necessary)
    * TODO: Configure remote in webpack.config.js file - do this once the remote is setup (ie. you know the localhost port or the server the remote is hosted on)
* Run the shell app (`npm run start`) on `http://locahost:4200` NB. There is a JavaScript error however `Uncaught SyntaxError: Cannot use 'import.meta' outside a module`
  
## Create the remote application
* Create application using Angular CLI v14 
  * `ng new mf-remote1 --create-application false`
  * Using the --create-application false flag  as we want the remote to have a multiple projects
* Create account-master project 
  * `ng g application account-master --routing --style scss` 
* Create home component inside account-master 
  * `ng generate component home --project account-master`
* Create account-master module with routing 
  * `ng generate module account-master --project account-master --module app --routing --route accountmaster`
  * Need to manually change base routing module to include default route to Home component
* Run the application `npm run start` It should run on http://localhost:4200 and display the home component. http://localhost:4200/accountmaster should display the account master component
* Install module federation plugin (14.3.9) 
  * `npm i @angular-architects/module-federation`
* Use plugin to setup module federation, as a remote, using port 4201: 
  * `ng add @angular-architects/module-federation --project account-master --port 4201`
  * This command does the following:
    *  Replace the default Angular builder with `ngx-build-plus` , see angular.json > projects.PROJECT-NAME.architect.build.builder
    * Add extraWebpackConfig and commonChunk false option, see angular.json - projects.PROJECT-NAME.architect.build.options.
    * Update main.js to load from a bootstrap.ts file (not sure why this is necessary)
    * Serve the locally running application on port 4201, see angular.json options
    * Create webpack.config.js, with configuration that exposes the account-master component
    * We want to expose the module rather than the component, so need to update the webpack.config.js:
  ```
  exposes: {
    './Module': './projects/account-master/src/app/account-master/account-master.module.ts',
  },
  ```
* Start the application locally `npm run start` 
* Check it loads at `http://localhost:4201`


## Add remote to the shell application
Now we have setup the remote, we can add to the shell application
* In webpack.config.js:
  ```
    remotes: {
        "accountMaster": "http://localhost:4201/remoteEntry.js",
    },
    ``` 
* Create a route that will load the remote. In app-routing.module.ts:
```
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'account-master', loadChildren: () => import('accountMaster/Module').then(m => m.AccountMasterModule) },
];
```
* The IDE will complain because it can't find AccountMasterModule, so we need to declare the module. Create a file in src/decl.d.ts with:
```
declare module 'accountMaster/Module';
```
* Add a router-outlet, if not already added
* Now add a link to the remote eg
```
<a routerLink="/account-master">mfe1</a>
```
* Run the server `npm run start` and open `http://localhost:4200`
* The shell app is loaded, and the remoteEntry.js code is also loaded
* Clicking on the mfe1 link will load the remote AccountMaster module 
* Notice that the shared Angular modules is are only loaded once - this will require synchronisation of versions if there are separate repos for the shell and each mfe


## Dynamic loading of remotes
So far we have a working mfe solution but it requires all the remote applications to be running
We can change this so that the remote code is only loaded when the user requests for it (lazy loaded)
* Use the loadRemoteModule() method from the @angular-architects/module-federation library
* Update app.routing.module.ts, like so
```
{ 
    path: 'account-master', 
    loadChildren: () => loadRemoteModule({
      type: 'module',
      remoteEntry: 'http://localhost:4201/remoteEntry.js',
      exposedModule: './Module'
    }).then(m => m.AccountMasterModule)
  },
```
* Remove the remote config from webpack.config.js
* Now the remote code is only loaded when the user clicks on the link
* The shell app will still work if it's remotes are down

## Deploying to vercel
* Upload repos to git
* Link in Vercel
* Create environment variables to hold vercel server names

## Add second and third mfe2: one repo with 2 projects 
* See mfe-remote2-arborio - this has 2 project which are deployed to two separate servers

## Add third mfe3, one project with multiple modules


## Create an Angular library and publish to npm
Add basic data sharing service

## Include Angular material and share it among shell, mfe1 and mfe2

## Issues
* Do not share the mfe's AppModule, as this creates multiple root scopes. Only share the feature modules
* If the module requires dependencies eg httpclientmodule , you will need to share this from the shell's AppModule
  * So in the remote, you will need to add HttpClientModule to the app.module. The remote will work if standlone
  * But within the shell, this won't work. The HttpClientModule needs to be added to the app.module in the shell.
  * Basically the shell's app module acts like all the remote's app modules.. so there will be co-ordination required between mfes.
