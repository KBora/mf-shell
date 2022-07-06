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
    * Update main.js to load from a bootstrap.ts file
      * This is required to bootstrap the app asychronously see https://github.com/angular-architects/module-federation-plugin/issues/93#issuecomment-954108535
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
* Also has submodules

## Create an Angular library and publish to npm
* Create Angular library
  * `ng generate library kwoo-test-lib`
* Add basic data sharing service with a counter kwoo-test-lib
* Upload library to npm
  * `ng build kwoo-test-lib`
  * `cd dist\kwoo-test-lib`
  * `npm publish`
* Install in shell `npm i kwoo-test-lib`
* Display counter in shell header
* Install in remote 1
* Display counter - it is a separate instance so counter values are not synchronised
* How to share? Update webpack.config.js in both repos add to the shared config: eg
```
  shared: share({
    "@angular/core": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
    "@angular/common": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
    "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
    "@angular/router": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
    "kwoo-test-lib": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
    
    ...sharedMappings.getDescriptors()
})
```

## Install Angular material and share it among shell, mfe1 and mfe2
* Install in shell
  * `ng add @angular/material`
  * Choose a theme, global Angular Material typography Y, include animations module Y
* Error Could not find bootstrapApplication call in src/main.ts
  * This is because of our MFE setup - main.ts has dynamic import of boostrap.ts
  * To fix, replace main.ts with bootstrap.ts in angular.json AND replace the builder with the default angular builder (@angular-devkit/build-angular:browser), then install material, then revert the changes
  * Share material by adding it to the shell webconfig
  ```
    "@angular/material": { singleton: true, strictVersion: true, requiredVersion: 'auto', includeSecondaries: true },   
  ```
  * Import individual material modules to the feature module in the remote. You can skip adding to the shell app module if it is only used in the remote and not the shell
  * *DO NOT IMPORT BROWSERANIMATIONSMODULE* in the remote.. it causes weird stuff and the shared service singleton breaks

## Issues
* Do not share the remote's AppModule, as this creates multiple root scopes. Only share the feature modules.. ie. only expose feature modules. the feature module can contain submodules.
* If the module requires dependencies eg httpclientmodule , you will need to share this from the shell's AppModule
  * So in the remote, you will need to add HttpClientModule to the app.module. The remote will work if standlone
  * But within the shell, this won't work. The HttpClientModule needs to be added to the app.module in the shell.
  * Basically the shell's app module acts like all the remote's app modules.. so there will be co-ordination required between mfes.
* Updates to shared libraries
  * strictVersion: true config means that remotes and shell must use the same version of shared library otherwise this error appears:
    `ERROR Error: Uncaught (in promise): Error: Unsatisfied version 0.2.1 from mfShell of shared singleton module kwoo-test-lib (required =0.0.1)
Error: Unsatisfied version 0.2.1 from mfShell of shared singleton module kwoo-test-lib (required =0.0.1)`
* Could not get remote interceptors to work.. possible because they need to be provide with HttpClient, and that is done in the shell