import { Injectable,inject } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, map, delay } from 'rxjs';
import { Analyse, AnalyseType } from '../pages/models/anlayse.model';
import { DatasetsService } from './datasets.service';
import { Firestore, collection, addDoc,doc, deleteDoc  } from '@angular/fire/firestore';
import { mean,
  minValue,
  maxValue,
  median,
  variance,
  std,
  detectOutliers,
  correlation as correlationCalc,
  histogram as histogramCalc } from '../utils/utils-stats';


@Injectable({
  providedIn: 'root',
})
export class AnalysesService {
  
  private analyses$ = new BehaviorSubject<Analyse[]>(this.loadFromStorage());
  private datasetService = inject(DatasetsService);
  private firestore = inject(Firestore);

  constructor() {}

  // ------------------- STORAGE LOCAL -------------------
  private saveToStorage() {
    localStorage.setItem('analyses', JSON.stringify(this.analyses$.value));
  }

  private loadFromStorage(): Analyse[] {
    const data = localStorage.getItem('analyses');
    return data ? JSON.parse(data) : [];
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  // ------------------- GETTERS -------------------
  getAllAnalyses(): Observable<Analyse[]> {
    return this.analyses$.asObservable();
  }

  getById(id: string): Observable<Analyse | undefined> {
    return this.getAllAnalyses().pipe(
      map(list => list.find(a => a.id === id))
    );
  }

  // ------------------- RUN Analyse -------------------
  runAnalyse(datasetId: string, type: AnalyseType, column1?: string, column2?: string): Observable<Analyse> {
  const id = this.generateId();
  const startedAt = new Date();

  return this.datasetService.getDatasetById(datasetId).pipe(
    switchMap(dataset => {
      if (!dataset) throw new Error("Dataset introuvable");

      const Analyse: Analyse = {
        id,
        datasetId,
        datasetName: dataset.name,
        type,
        status: 'En cours',
        startedAt
      };

      if (!this.analyses$.value.find(a => a.id === Analyse.id)) {
  this.analyses$.next([...this.analyses$.value, Analyse]);
}

      this.saveToStorage();

      return of(Analyse).pipe(
        delay(10000),
        map(a => this.finishAnalyse(a, dataset.data, column1, column2))
      );
    })
  );
}


  // ------------------- FINISH Analyse -------------------
  private finishAnalyse(Analyse: Analyse, datasetData: any, column1?: string, column2?: string): Analyse {
  try {
    switch (Analyse.type) {
      case 'Statistiques descriptives': {
        const col = column1 || datasetData.columns[0];
        const colIndex = datasetData.columns.indexOf(col);
        const values = datasetData.rows.map((r: any) => r[colIndex]);
        Analyse.result = {
          column: col,
          min: minValue(values),
          max: maxValue(values),
          mean: mean(values),
          median: median(values),
          variance: variance(values),
          std: std(values)
        };
        break;
      }
      case 'Valeurs aberrantes': {
        const col = column1 || datasetData.columns[0];
        const colIndex = datasetData.columns.indexOf(col);
        const values = datasetData.rows.map((r: any) => r[colIndex]);
        Analyse.result = { column: col, ...detectOutliers(values) };
        break;
      }
      case 'Corrélation': {
        const idxX = datasetData.columns.indexOf(column1 || datasetData.columns[0]);
        const idxY = datasetData.columns.indexOf(column2 || datasetData.columns[1]);
        const x = datasetData.rows.map((r: any) => r[idxX]);
        const y = datasetData.rows.map((r: any) => r[idxY]);
        Analyse.result = {
          columnX: column1,
          columnY: column2,
          coefficient: correlationCalc(x, y)
        };
        break;
      }
      case 'Histogramme automatique': {
        const col = column1 || datasetData.columns[0];
        const colIndex = datasetData.columns.indexOf(col);
        const values = datasetData.rows.map((r: any) => r[colIndex]);
        Analyse.result = { column: col, ...histogramCalc(values, 10) };
        break;
      }
    }

    Analyse.status = 'Terminé';
    Analyse.finishedAt = new Date();
    this.saveAnalyseToFirestore(Analyse);

  } catch (err) {
    Analyse.status = 'Échec';
    Analyse.result = { error: 'Impossible de calculer cette analyse.' };
  }
  const updated = this.analyses$.value.map(a => a.id === Analyse.id ? Analyse : a);
  this.analyses$.next(updated);

  this.saveToStorage();

  return Analyse;
}


  // ------------------- SAUVEGARDE FIREBASE -------------------
  private async saveAnalyseToFirestore(Analyse: Analyse) {
  const colRef = collection(this.firestore, 'analyses');
  try {
    const docRef = await addDoc(colRef, Analyse);
    console.log('Analyse sauvegardée dans Firebase :', docRef.id);
    Analyse.firestoreId = docRef.id;  // stocker l'ID pour pouvoir supprimer plus tard
  } catch (err) {
    console.error('Erreur sauvegarde Firebase :', err);
  }
}
deleteAnalyseFromFirebase(analyse: Analyse) {
  if (!analyse.firestoreId) return;

  const docRef = doc(this.firestore, 'analyses', analyse.firestoreId);
  deleteDoc(docRef)
    .then(() => console.log('Analyse supprimée de Firebase :', analyse.firestoreId))
    .catch(err => console.error('Erreur suppression Firebase :', err));
}
deleteAnalyse(id: string) {
  const analyse = this.analyses$.value.find(a => a.id === id);
  if (!analyse) return;

  // Supprimer de Firebase si nécessaire
  this.deleteAnalyseFromFirebase(analyse);

  // Supprimer du BehaviorSubject et du localStorage
  const updated = this.analyses$.value.filter(a => a.id !== id);
  this.analyses$.next(updated);
  this.saveToStorage();
}
}
