import { Injectable } from '@angular/core'; 
import { Firestore, collection, addDoc, collectionData, doc, docData, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatasetsService {

  constructor(private firestore: Firestore) {}

  // 🔥 Ajouter un dataset
  addDataset(dataset: any) {
    console.log("🔥 SERVICE : addDataset() appelé");
    console.log("Dataset envoyé :", dataset);

    const collectionRef = collection(this.firestore, 'datasets');
    return addDoc(collectionRef, dataset);
  }

  // 🔥🔥 Récupérer tous les datasets
  getAllDatasets(): Observable<any[]> {
    console.log("📥 SERVICE : getAllDatasets() appelé");

    const collectionRef = collection(this.firestore, 'datasets');
    return collectionData(collectionRef, { idField: 'id' }); 
    // idField permet d'ajouter automatiquement l'id Firestore dans l'objet
  }

  // 🔹 Récupérer un dataset par ID
  getDatasetById(id: string): Observable<any> {
    console.log(`📥 SERVICE : getDatasetById(${id}) appelé`);

    const docRef = doc(this.firestore, `datasets/${id}`);
    return docData(docRef, { idField: 'id' }); 
    // idField permet d’inclure l’ID dans l’objet retourné
  }

  // 🆕 SUPPRIMER un dataset par ID
  deleteDataset(id: string) {
    console.log(`🗑️ SERVICE : deleteDataset(${id}) appelé`);

    const docRef = doc(this.firestore, `datasets/${id}`);
    return deleteDoc(docRef);
  }
}
