import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { DatasetsService } from '../../services/datasets.service';
import { Router } from '@angular/router';

// Pipe pour formater la taille des fichiers
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
  id: string;
  name: string;
  category: string;
  description: string;
  rows: number;
  columns: number;
  date: string;
  importDate: Date;
  loading?: boolean;
}

interface PageItem {
  type: 'number' | 'ellipsis';
  value: number | string;
}

@Component({
  selector: 'app-datasets',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FileSizePipe],
  templateUrl: './datasets.html',
  styleUrl: './datasets.css',
  standalone: true
})
export class Datasets implements OnInit {
  // Propriétés existantes
  searchTerm: string = '';
  selectedTheme: string = '';
  selectedDate: string = '';
  selectedSort: string = 'name-asc';
  
  // Propriétés du modal
  showModal: boolean = false;
  isSubmitting: boolean = false;
  formSubmitted: boolean = false;
  isDragover: boolean = false;
  selectedFile: File | null = null;
  
  datasetForm: FormGroup;
  themes: any[] = [];
  datasets: Dataset[] = [];
  filteredDatasets: Dataset[] = [];

  // Nouvelles propriétés pour la pagination
  currentPage: number = 1;
  pageSize: number = 8;
  paginatedDatasets: Dataset[] = [];
  totalPages: number = 1;
  totalFilteredItems: number = 0;
  startIndex: number = 0;
  endIndex: number = 0;

  constructor(
    private fb: FormBuilder, 
    private themeService: ThemeService, 
    private datasetsService: DatasetsService,
    private router: Router
  ) {
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

    this.datasetsService.getAllDatasets().subscribe(data => {
      this.datasets = data.map(d => {
        let importDate: Date;

        if (d.dateC) {
          importDate = this.simpleParseFirebaseDate(d.dateC);
        } else {
          importDate = new Date();
        }

        return {
          id: d.id,
          name: d.name || '',
          category: d.theme || d.category || '',
          description: d.desc || d.description || '',
          rows: d.nbLig || d.rows || 0,
          columns: d.nbCol || d.columns || 0,
          date: importDate.toLocaleDateString('fr-FR'),
          importDate: importDate,
          loading: false
        };
      });

      this.filteredDatasets = [...this.datasets];
      this.applyFilters();
      this.updatePagination();
    });
  }

  // ==================== MÉTHODES DE PAGINATION ====================

  updatePagination() {
    this.totalFilteredItems = this.filteredDatasets.length;
    this.totalPages = Math.ceil(this.totalFilteredItems / this.pageSize);
    
    // Ajuster la page courante si nécessaire
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
    
    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.endIndex = Math.min(this.startIndex + this.pageSize, this.totalFilteredItems);
    
    this.paginatedDatasets = this.filteredDatasets.slice(this.startIndex, this.endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  getVisiblePages(): PageItem[] {
    const pages: PageItem[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Afficher toutes les pages
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push({ type: 'number', value: i });
      }
    } else {
      // Logique pour les points de suspension
      if (this.currentPage <= 3) {
        // Début
        for (let i = 1; i <= 4; i++) pages.push({ type: 'number', value: i });
        pages.push({ type: 'ellipsis', value: '...' });
        pages.push({ type: 'number', value: this.totalPages });
      } else if (this.currentPage >= this.totalPages - 2) {
        // Fin
        pages.push({ type: 'number', value: 1 });
        pages.push({ type: 'ellipsis', value: '...' });
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push({ type: 'number', value: i });
        }
      } else {
        // Milieu
        pages.push({ type: 'number', value: 1 });
        pages.push({ type: 'ellipsis', value: '...' });
        pages.push({ type: 'number', value: this.currentPage - 1 });
        pages.push({ type: 'number', value: this.currentPage });
        pages.push({ type: 'number', value: this.currentPage + 1 });
        pages.push({ type: 'ellipsis', value: '...' });
        pages.push({ type: 'number', value: this.totalPages });
      }
    }
    
    return pages;
  }

  onPageClick(pageItem: PageItem) {
    if (pageItem.type === 'number') {
      this.goToPage(pageItem.value as number);
    }
    // Pour les ellipsis, on ne fait rien
  }

  // ==================== MÉTHODES EXISTANTES MODIFIÉES ====================

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
    this.currentPage = 1; // Reset à la première page après filtrage
    this.updatePagination();
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
    this.updatePagination();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedTheme = '';
    this.selectedDate = '';
    this.selectedSort = 'name-asc';
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearchChange() {
    this.currentPage = 1;
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

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject("Erreur lors de la lecture du fichier");
      reader.readAsText(file);
    });
  }

  async onSubmit() {
    this.formSubmitted = true;

    if (this.datasetForm.invalid || !this.selectedFile) return;

    this.isSubmitting = true;

    try {
      const info = await this.extractFileInfo(this.selectedFile);
      const fileContent = await this.readFileAsText(this.selectedFile);

      const datasetToSave = {
        name: this.datasetForm.value.name,
        desc: this.datasetForm.value.description,
        theme: this.datasetForm.value.theme,
        nbLig: info.rows,
        nbCol: info.cols,
        dateC: new Date(),
        contenu: fileContent
      };

      await this.datasetsService.addDataset(datasetToSave);
      this.closeModal();
      this.isSubmitting = false;

    } catch (err) {
      console.error("Erreur ajout dataset :", err);
      this.isSubmitting = false;
    }
  }

  // ==================== MÉTHODES EXISTANTES ====================

  viewDataset(dataset: Dataset) {
   localStorage.setItem("dataset", JSON.stringify(dataset));
     this.router.navigate(['/datasets', dataset.id]);
  }

  analyzeDataset(dataset: Dataset) {
    console.log('Analyser le dataset:', dataset.name);
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

  trackByDatasetId(index: number, dataset: Dataset): string {
    return dataset.id;
  }

  async extractFileInfo(file: File): Promise<{ rows: number; cols: number }> {
    const content = await this.readFileAsText(file);
    const lines = content.split('\n').filter(l => l.trim() !== '');
    const nbRows = lines.length;
    const nbCols = lines[0].split(',').length;

    return { rows: nbRows, cols: nbCols };
  }

  private simpleParseFirebaseDate(dateInput: any): Date {
    try {
      if (dateInput && typeof dateInput === 'object' && dateInput.seconds) {
        return new Date(dateInput.seconds * 1000);
      }
      
      if (typeof dateInput === 'string') {
        const match = dateInput.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
        if (match) {
          const [, day, month, year] = match;
          const monthMap: { [key: string]: string } = {
            'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
            'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
            'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
          };
          
          const monthNumber = monthMap[month.toLowerCase()];
          if (monthNumber) {
            return new Date(`${year}-${monthNumber}-${day.padStart(2, '0')}`);
          }
        }
        
        const parsed = new Date(dateInput);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      
      return new Date();
    } catch (error) {
      console.error('Erreur de parsing de date:', error);
      return new Date();
    }
  }
}