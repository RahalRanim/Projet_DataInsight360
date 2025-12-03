import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemeService } from '../../../services/theme.service';
import { DatasetsService } from '../../../services/datasets.service';
import { ConfirmModal } from '../../models/confirm-modal/confirm-modal';
import { SuccesModal } from '../../models/succes-modal/succes-modal';
import { ErrorModal } from '../../models/error-modal/error-modal';

interface Theme {
  id: string;
  libelle: string;
  datasetsCount?: number;
}

@Component({
  selector: 'app-themes',
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    ConfirmModal,
    SuccesModal,
    ErrorModal
  ],
  templateUrl: './themes.html',
  styleUrl: './themes.css',
  standalone: true
})
export class ThemesDS implements OnInit {
  // Propriétés pour la gestion des données
  themes: Theme[] = [];
  filteredThemes: Theme[] = [];
  searchTerm: string = '';
  
  // Propriétés pour les modales
  showThemeModal: boolean = false;
  showConfirmModal: boolean = false;
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  
  // Propriétés pour la gestion des formulaires
  themeForm: FormGroup;
  editingTheme: Theme | null = null;
  themeToDelete: Theme | null = null;
  
  // Propriétés d'état
  isSubmitting: boolean = false;
  isDeleting: boolean = false;
  formError: string = '';
  successMessage: string = '';
  errorMsg: string = '';

  constructor(
    private fb: FormBuilder,
    private themeService: ThemeService,
    private datasetsService: DatasetsService
  ) {
    this.themeForm = this.fb.group({
      libelle: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit() {
    console.log('Component Themes initialisé');
    this.loadThemes();
  }

  // ==================== CHARGEMENT DES DONNÉES ====================

  private loadThemes() {
    console.log('Chargement des thèmes...');
    this.themeService.getThemes().subscribe({
      next: (themes) => {
        console.log('Thèmes chargés:', themes);
        this.themes = themes;
        this.calculateDatasetsCount();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des thèmes:', error);
        this.errorMsg = 'Erreur lors du chargement des thèmes.';
        this.showErrorModal = true;
      }
    });
  }

  private calculateDatasetsCount() {
    this.datasetsService.getAllDatasets().subscribe({
      next: (datasets) => {
        const themeCounts: { [key: string]: number } = {};
        
        datasets.forEach(dataset => {
          const theme = dataset.theme || dataset.category;
          if (theme) {
            themeCounts[theme] = (themeCounts[theme] || 0) + 1;
          }
        });

        this.themes.forEach(theme => {
          theme.datasetsCount = themeCounts[theme.libelle] || 0;
        });

        this.applyFilters();
      },
      error: (error) => {
        console.error('Erreur lors du calcul des datasets:', error);
      }
    });
  }

  // ==================== FILTRES ET RECHERCHE ====================

  applyFilters() {
    let filtered = [...this.themes];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(theme =>
        theme.libelle.toLowerCase().includes(term)
      );
    }

    this.filteredThemes = filtered;
  }

  clearFilters() {
    this.searchTerm = '';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm;
  }

  // ==================== GESTION DES THÈMES (CRUD) ====================

  createNewTheme() {
    console.log('Création nouveau thème');
    this.editingTheme = null;
    this.themeForm.reset();
    this.formError = '';
    this.showThemeModal = true;
  }

  editTheme(theme: Theme) {
    console.log('Modification thème:', theme);
    this.editingTheme = theme;
    this.themeForm.patchValue({
      libelle: theme.libelle
    });
    this.formError = '';
    this.showThemeModal = true;
  }

  closeThemeModal() {
    console.log('Fermeture modal thème');
    this.showThemeModal = false;
    this.themeForm.reset();
    this.editingTheme = null;
    this.formError = '';
    this.isSubmitting = false;
  }

  async onThemeSubmit() {
    console.log('Soumission formulaire thème');
    
    this.markFormGroupTouched();
    
    if (this.themeForm.invalid) {
      console.log('Formulaire invalide');
      this.formError = 'Veuillez corriger les erreurs dans le formulaire.';
      return;
    }

    this.isSubmitting = true;
    this.formError = '';

    try {
      const formValue = this.themeForm.value;
      console.log('Valeurs du formulaire:', formValue);

      if (this.editingTheme) {
        console.log('Modification du thème:', this.editingTheme.id);
        await this.updateTheme(this.editingTheme.id, formValue.libelle);
        this.successMessage = 'Thème modifié avec succès.';
      } else {
        console.log('Création nouveau thème');
        await this.createTheme(formValue.libelle);
        this.successMessage = 'Thème créé avec succès.';
      }

      this.closeThemeModal();
      this.showSuccessModal = true;
      
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
      this.errorMsg = error.message || 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.';
      this.showErrorModal = true;
    } finally {
      this.isSubmitting = false;
    }
  }

  private async createTheme(libelle: string) {
    console.log('Création thème:', libelle);
    
    // Vérifier si le thème existe déjà
    const themeExists = this.themes.some(theme => 
      theme.libelle.toLowerCase() === libelle.toLowerCase()
    );
    
    if (themeExists) {
      throw new Error('Un thème avec ce nom existe déjà.');
    }

    // Créer le thème dans Firebase
    await this.themeService.createTheme({ libelle });
    
    // Recharger les thèmes
    this.loadThemes();
  }

  private async updateTheme(id: string, libelle: string) {
    console.log('Mise à jour thème:', id, libelle);
    
    // Vérifier si un autre thème a déjà ce nom
    const themeExists = this.themes.some(theme => 
      theme.id !== id && theme.libelle.toLowerCase() === libelle.toLowerCase()
    );
    
    if (themeExists) {
      throw new Error('Un autre thème avec ce nom existe déjà.');
    }

    // Mettre à jour le thème dans Firebase
    await this.themeService.updateTheme(id, { libelle });
    
    // Recharger les thèmes
    this.loadThemes();
  }

  confirmDelete(theme: Theme) {
    console.log('Confirmation suppression:', theme);
    this.themeToDelete = theme;
    this.showConfirmModal = true;
  }

  onConfirmModalClose(confirmed: boolean) {
    console.log('Confirmation modal:', confirmed);
    this.showConfirmModal = false;
    
    if (confirmed) {
      this.deleteTheme();
    } else {
      this.themeToDelete = null;
    }
  }

  async deleteTheme() {
    if (!this.themeToDelete) return;

    console.log('Suppression thème:', this.themeToDelete);
    this.isDeleting = true;

    try {
      if (this.themeToDelete.datasetsCount && this.themeToDelete.datasetsCount > 0) {
        this.errorMsg = `Impossible de supprimer ce thème car il est utilisé par ${this.themeToDelete.datasetsCount} dataset(s).`;
        this.showErrorModal = true;
        this.themeToDelete = null;
        return;
      }

      await this.performDelete(this.themeToDelete.id);
      this.successMessage = 'Thème supprimé avec succès.';
      this.showSuccessModal = true;
      
    } catch (error: any) {
      console.error('Erreur lors de la suppression du thème:', error);
      this.errorMsg = error.message || 'Une erreur est survenue lors de la suppression. Veuillez réessayer.';
      this.showErrorModal = true;
    } finally {
      this.isDeleting = false;
      this.themeToDelete = null;
    }
  }

  private async performDelete(id: string) {
    console.log('Suppression thème ID:', id);
    await this.themeService.deleteTheme(id);
    this.loadThemes();
  }

  onSuccessModalClose() {
    this.showSuccessModal = false;
    this.successMessage = '';
  }

  onErrorModalClose() {
    this.showErrorModal = false;
    this.errorMsg = '';
  }

  getDeleteMessage(): string {
    if (!this.themeToDelete) return '';
    
    let message = `Êtes-vous sûr de vouloir supprimer le thème "${this.themeToDelete.libelle}" ? Cette action est irréversible.`;
    
    if (this.themeToDelete.datasetsCount && this.themeToDelete.datasetsCount > 0) {
      message += `\n\nAttention : Ce thème est utilisé par ${this.themeToDelete.datasetsCount} dataset(s).`;
    }
    
    return message;
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  private markFormGroupTouched() {
    Object.keys(this.themeForm.controls).forEach(key => {
      const control = this.themeForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  trackByThemeId(index: number, theme: Theme): string {
    return theme.id;
  }
}