import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  constructor(private firestore: Firestore) {}

  getThemes(): Observable<any[]> {
    const themeCollection = collection(this.firestore, 'theme');
    return collectionData(themeCollection, { idField: 'id' }) as Observable<any[]>;
  }

  // Méthodes CRUD supplémentaires
  async createTheme(theme: { libelle: string }): Promise<any> {
    const themeCollection = collection(this.firestore, 'theme');
    
    // Vérifier si le thème existe déjà
    const q = query(themeCollection, where('libelle', '==', theme.libelle));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      throw new Error('Un thème avec ce nom existe déjà.');
    }
    
    return await addDoc(themeCollection, theme);
  }

  async updateTheme(id: string, theme: Partial<{ libelle: string }>): Promise<void> {
    const themeDoc = doc(this.firestore, `theme/${id}`);
    
    // Vérifier si un autre thème a le même nom
    if (theme.libelle) {
      const themeCollection = collection(this.firestore, 'theme');
      const q = query(
        themeCollection, 
        where('libelle', '==', theme.libelle),
        where('__name__', '!=', id)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Un autre thème avec ce nom existe déjà.');
      }
    }
    
    return await updateDoc(themeDoc, theme);
  }

  async deleteTheme(id: string): Promise<void> {
    const themeDoc = doc(this.firestore, `theme/${id}`);
    return await deleteDoc(themeDoc);
  }
}