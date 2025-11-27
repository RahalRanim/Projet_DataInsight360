import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  constructor(private firestore: Firestore) {}

  getThemes(): Observable<any[]> {
    // 1. Référence vers la collection "themes"
    const themeCollection = collection(this.firestore, 'theme');

    // 2. Retourner les données sous forme d’Observable
    return collectionData(themeCollection, { idField: 'id' }) as Observable<any[]>;
  }

}
