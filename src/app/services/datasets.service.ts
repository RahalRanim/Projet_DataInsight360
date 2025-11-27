import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class DatasetsService {

  constructor(private firestore: Firestore, private storage: Storage) {}

  // 1️⃣ Upload fichier
  uploadFile(file: File): Promise<string> {
    const filePath = `datasets/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);

    return uploadBytes(storageRef, file)
      .then(() => getDownloadURL(storageRef));
  }

  // 2️⃣ Ajouter le dataset dans Firestore
  addDataset(dataset: any) {
    console.log("🔥 SERVICE addDataset() appelé !");
    console.log("Envoi : ", dataset);
    const coll = collection(this.firestore, 'datasets');
    return addDoc(coll, dataset);
  }
}
