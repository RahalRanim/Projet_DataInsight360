import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatasetsService } from '../../services/datasets.service';
import { AnalysesService } from '../../services/analyses.service';
import { AnalyseType, Analyse } from '../models/anlayse.model';
import { Router } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
@Component({
  selector: 'app-analyses-new',
  imports: [CommonModule,ReactiveFormsModule,FormsModule, NgIf, NgFor],
  templateUrl: './analyses-new.html',
  styleUrl: './analyses-new.css',
})
export class AnalysesNew {
  form!: FormGroup;
  datasets: any[] = [];
  columns: string[] = [];
  isLoading = false;

  analyseTypes: AnalyseType[] = [
    'Statistiques descriptives',
    'Valeurs aberrantes',
    'Corrélation',
    'Histogramme automatique'
  ];

  constructor(
    private fb: FormBuilder,
    private datasetService: DatasetsService,
    private analysesService: AnalysesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialiser formulaire
    this.form = this.fb.group({
      datasetId: ['', Validators.required],
      type: ['', Validators.required],
      column1: [''],
      column2: ['']
    });

    // Charger tous les datasets
    this.datasetService.getAllDatasets().subscribe(data => {
      this.datasets = data;

      // Si un dataset était déjà sélectionné, mettre à jour les colonnes
      const selectedId = this.form.get('datasetId')?.value;
      if (selectedId) this.updateColumns(selectedId);
    });

    // Quand le dataset change, mettre à jour les colonnes
    this.form.get('datasetId')?.valueChanges.subscribe(id => {
      this.updateColumns(id);
    });

    // Quand le type d'analyse change, activer ou désactiver colonne2
    this.form.get('type')?.valueChanges.subscribe(type => {
      if (type === 'Corrélation') {
        this.form.get('column2')?.enable();
      } else {
        this.form.get('column2')?.disable();
        this.form.patchValue({ column2: '' });
      }
    });
  }

  // Met à jour les colonnes numériques disponibles pour le dataset sélectionné
  updateColumns(datasetId: string) {
    const ds = this.datasets.find(d => d.id === datasetId);

    if (!ds || !ds.data || !ds.data.columns || !ds.data.rows) {
      this.columns = [];
      this.form.patchValue({ column1: '', column2: '' });
      return;
    }

    // Ne garder que les colonnes numériques
    this.columns = ds.data.columns.filter((col: string, idx: number) => {
      const sample = ds.data.rows[0]?.[idx];
      return sample !== undefined && !isNaN(Number(sample));
    });

    // Reset colonnes sélectionnées
    this.form.patchValue({ column1: '', column2: '' });
  }

  submit() {
    if (this.form.invalid) return;

    const { datasetId, type, column1, column2 } = this.form.value;

    this.isLoading = true;

    this.analysesService.runAnalyse(datasetId, type, column1, column2).subscribe({
      next: (analyse: Analyse) => {
        console.log('Analyse terminée :', analyse);
        this.isLoading = false;
        this.router.navigate(['/analyses']);
      },
      error: (err) => {
        console.error('Erreur analyse :', err);
        this.isLoading = false;
      }
    });
  }
}