import { loadRemoteModule } from '@angular-architects/module-federation';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { 
    path: 'account-master', 
    loadChildren: () => loadRemoteModule({
      type: 'module',
      remoteEntry: `${environment.mfe.accountMaster}/remoteEntry.js`,
      exposedModule: './Module'
    }).then(m => m.AccountMasterModule)
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
