import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Datasets } from './pages/datasets/datasets';

export const routes: Routes = [
    {
        path: '',
        component: Home,
        children:[
            {
                path: 'datasets',
                component: Datasets
            }
        ]
    },
];
