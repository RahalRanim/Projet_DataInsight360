import { Routes } from '@angular/router';
import { AccueilComponent } from './pages/accueil/accueil';
import { Home } from './pages/home/home';
import { Datasets } from './pages/datasets/datasets';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { DatasetDetails } from './pages/dataset-details/dataset-details';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { Themes } from './pages/themes/themes';
import { Users } from './pages/users/users';
import { authGuard, adminGuard, dataScientistGuard } from './guards/auth.guard';
import { HomeDataScientist} from './pages/data-scientist/home/home';
import { DashboardDSComponent } from './pages/data-scientist/dashboard/dashboard';
import { ThemesDS } from './pages/data-scientist/themes/themes';

export const routes: Routes = [
    { path: '', component: AccueilComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    
    {
        path: 'home',
        component: Home,
        canActivate: [authGuard],
        children:[
            {
                path: 'datasets',
                component: Datasets,
                canActivate: [adminGuard]
            },
            {
                path: 'datasets/:id',
                component: DatasetDetails,
                canActivate: [adminGuard]
            },
            { 
                path: 'dashboard', 
                component: DashboardComponent,
                canActivate: [adminGuard]
            },
            {
                path: 'themes',
                component: Themes,
                canActivate: [adminGuard]
            },
            {
                path: 'users',
                component: Users,
                canActivate: [adminGuard]
            }
        ]
    },
    {
        path: 'data-scientist',
        component: HomeDataScientist,
        canActivate: [authGuard],
        children:[
            { 
                path: 'dashboard', 
                component: DashboardDSComponent,
                canActivate: [dataScientistGuard]
            },
            {
                path: 'themes',
                component: ThemesDS,
                canActivate: [dataScientistGuard]
            }
        ]
    },
];
