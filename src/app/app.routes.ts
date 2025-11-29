import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Datasets } from './pages/datasets/datasets';
import { DatasetDetails } from './pages/dataset-details/dataset-details';
import { Themes } from './pages/themes/themes';
import { Users } from './pages/users/users';
import { Analyses } from './pages/analyses/analyses';
import { AnalysesNew } from './pages/analyses-new/analyses-new';

export const routes: Routes = [
    {
        path: '',
        component: Home,
        children:[
            {
                path: 'datasets',
                component: Datasets
            },
            {
                path: 'datasets/:id',
                component: DatasetDetails
            },
            {
                path: 'themes',
                component: Themes
            },
            {
                path: 'users',
                component: Users
            }, 
            {
                path: 'analyses',
                component: Analyses
            },
            {
                path: "analyses/new",
                component : AnalysesNew
            },
        ]
    },
];
