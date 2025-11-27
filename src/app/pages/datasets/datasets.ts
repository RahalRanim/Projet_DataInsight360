import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { DatasetsService } from '../../services/datasets.service';

// Pipe pour formater la taille des fichiers - Déclaré AVANT le composant
@Pipe({
  name: 'fileSize',
  standalone: true
})
export class FileSizePipe implements PipeTransform {
  transform(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

interface Dataset {
  id: number;
  name: string;
  category: string;
  description: string;
  rows: number;
  columns: number;
  date: string;
  importDate: Date;
  loading?: boolean;
}

@Component({
  selector: 'app-datasets',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FileSizePipe],
  templateUrl: './datasets.html',
  styleUrl: './datasets.css',
  standalone: true
})
export class Datasets implements OnInit {
  searchTerm: string = '';
  selectedTheme: string = '';
  selectedDate: string = '';
  selectedSort: string = 'name-asc';
  
  // Nouvelles propriétés pour le modal
  showModal: boolean = false;
  isSubmitting: boolean = false;
  formSubmitted: boolean = false;
  isDragover: boolean = false;
  selectedFile: File | null = null;
  
  datasetForm: FormGroup;

  themes: any[] = [];


  datasets: Dataset[] = [
    {
      id: 1,
      name: 'Salaires_2024',
      category: 'finance',
      description: 'Données salariales des employés avec âge, département, ancienneté',
      rows: 1000,
      columns: 5,
      date: '15/01/2024',
      importDate: new Date('2024-01-15')
    },
    {
      id: 2,
      name: 'Trafic_Metro',
      category: 'transport',
      description: 'Flux de passagers dans le réseau de métro',
      rows: 15000,
      columns: 6,
      date: '28/02/2024',
      importDate: new Date('2024-02-28')
    },
    {
      id: 3,
      name: 'Ventes_Q2',
      category: 'finance',
      description: 'Historique des ventes du deuxième trimestre 2024',
      rows: 5420,
      columns: 8,
      date: '20/04/2024',
      importDate: new Date('2024-04-20')
    },
    {
      id: 4,
      name: 'Patients_Hopital',
      category: 'sante',
      description: 'Données anonymisées des patients et diagnostics',
      rows: 2500,
      columns: 12,
      date: '10/03/2024',
      importDate: new Date('2024-03-10')
    }
  ];

  filteredDatasets: Dataset[] = [...this.datasets];

  constructor(private fb: FormBuilder, private themeService: ThemeService, private datasetsService: DatasetsService) {
    // Initialisation du formulaire réactif
    this.datasetForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      theme: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.themeService.getThemes().subscribe(data => {
      this.themes = data;
    });
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm || !!this.selectedTheme || !!this.selectedDate || this.selectedSort !== 'name-asc';
  }

  // ==================== MÉTHODES DU MODAL ====================
  createNewDataset() {
    this.showModal = true;
    this.formSubmitted = false;
    this.selectedFile = null;
    this.isDragover = false;
  }

  closeModal() {
    this.showModal = false;
    this.datasetForm.reset();
    this.formSubmitted = false;
    this.selectedFile = null;
    this.isDragover = false;
  }

  // Gestion des fichiers
  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.handleFileSelection(file);
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragover = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragover = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragover = false;
  }

  private handleFileSelection(file: File) {
    if (file) {
      const allowedTypes = ['text/csv', 'application/json'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (allowedTypes.includes(file.type) || fileExtension === 'csv' || fileExtension === 'json') {
        this.selectedFile = file;
      } else {
        alert('Veuillez sélectionner un fichier CSV ou JSON valide.');
      }
    }
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
  }

  // Soumission du formulaire
  async onSubmit() {
    this.formSubmitted = true;

    if (this.datasetForm.invalid || !this.selectedFile) return;

    this.isSubmitting = true;

    try {
      // 1️⃣ Lire info du fichier
      const info = await this.extractFileInfo(this.selectedFile);

      // 2️⃣ Upload du fichier dans Firebase Storage
      const urlFile = await this.datasetsService.uploadFile(this.selectedFile);

      // 3️⃣ Préparer les données à enregistrer
      const datasetToSave = {
        name: this.datasetForm.value.name,
        desc: this.datasetForm.value.description,
        theme: this.datasetForm.value.theme,
        nbLig: info.rows,
        nbCol: info.cols,
        dateC: new Date(),
        urlFich: urlFile
      };

      // 4️⃣ Enregistrer dans Firestore
      await this.datasetsService.addDataset(datasetToSave);
      console.log("➡️ Appel du service addDataset() ",datasetToSave);

      // Reset modal
      this.closeModal();
      this.isSubmitting = false;

    } catch (err) {
      console.error("Erreur ajout dataset :", err);
      this.isSubmitting = false;
    }
  }


  // ==================== MÉTHODES EXISTANTES ====================
  onSearchChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.datasets];

    // Filtre par recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(dataset =>
        dataset.name.toLowerCase().includes(term) ||
        dataset.description.toLowerCase().includes(term) ||
        dataset.category.toLowerCase().includes(term)
      );
    }

    // Filtre par thème
    if (this.selectedTheme) {
      filtered = filtered.filter(dataset => dataset.category === this.selectedTheme);
    }

    // Filtre par date
    if (this.selectedDate) {
      const selectedDateObj = new Date(this.selectedDate);
      filtered = filtered.filter(dataset => {
        const datasetDate = new Date(dataset.importDate);
        return datasetDate.toDateString() === selectedDateObj.toDateString();
      });
    }

    this.filteredDatasets = filtered;
    this.applySort();
  }

  applySort() {
    switch (this.selectedSort) {
      case 'name-asc':
        this.filteredDatasets.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        this.filteredDatasets.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'date-desc':
        this.filteredDatasets.sort((a, b) => b.importDate.getTime() - a.importDate.getTime());
        break;
      case 'date-asc':
        this.filteredDatasets.sort((a, b) => a.importDate.getTime() - b.importDate.getTime());
        break;
      case 'rows-desc':
        this.filteredDatasets.sort((a, b) => b.rows - a.rows);
        break;
      case 'rows-asc':
        this.filteredDatasets.sort((a, b) => a.rows - b.rows);
        break;
    }
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedTheme = '';
    this.selectedDate = '';
    this.selectedSort = 'name-asc';
    this.applyFilters();
  }

  viewDataset(dataset: Dataset) {
    console.log('Voir le dataset:', dataset.name);
    // Implémentez la logique pour voir le dataset
  }

  analyzeDataset(dataset: Dataset) {
    console.log('Analyser le dataset:', dataset.name);
    // Implémentez la logique pour analyser le dataset
  }

  getCategoryClass(category: string): string {
    return `dataset-category ${category}`;
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'finance': 'Finance',
      'sante': 'Santé',
      'transport': 'Transport',
      'education': 'Éducation',
      'technologie': 'Technologie',
      'marketing': 'Marketing',
      'ressources-humaines': 'Ressources Humaines'
    };
    return labels[category] || category;
  }

  trackByDatasetId(index: number, dataset: Dataset): number {
    return dataset.id;
  }

  private async extractFileInfo(file: File): Promise<{ rows: number, cols: number }> {

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const content = reader.result as string;

          // JSON
          if (file.name.endsWith('.json')) {
            const json = JSON.parse(content);
            const rows = json.length;
            const cols = rows > 0 ? Object.keys(json[0]).length : 0;
            resolve({ rows, cols });
          }

          // CSV
          else if (file.name.endsWith('.csv')) {
            const lines = content.split('\n').filter(l => l.trim() !== '');
            const rows = lines.length - 1; // première ligne = header
            const cols = lines[0].split(',').length;
            resolve({ rows, cols });
          }

          else reject('Format non supporté');
        };

        reader.onerror = reject;

        reader.readAsText(file);
      });
    }

}