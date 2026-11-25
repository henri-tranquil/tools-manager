import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home-page';

/** Une seule page ; chaque outil a en plus sa propre URL, prérendue pour le référencement. */
export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'outils/:outil', component: HomePage },
  { path: '**', redirectTo: '' },
];
