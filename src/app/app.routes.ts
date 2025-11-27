import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Datasets } from './pages/datasets/datasets';
import { DatasetDetails } from './pages/dataset-details/dataset-details';

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
            }
        ]
    },
];
