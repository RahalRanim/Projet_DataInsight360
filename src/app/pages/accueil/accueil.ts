import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './accueil.html',
  styleUrls: ['./accueil.css']
})
export class AccueilComponent {
  email: string = '';

  features = [
    {
      icon: 'database',
      title: 'Gestion de Datasets',
      description: 'Importez et organisez vos fichiers CSV et JSON. Gérez tous vos jeux de données en un seul endroit.'
    },
    {
      icon: 'chart',
      title: 'Analyses Statistiques',
      description: 'Effectuez des analyses avancées : statistiques descriptives, corrélations, détection d\'anomalies.'
    },
    {
      icon: 'pie',
      title: 'Visualisations',
      description: 'Créez des graphiques interactifs : histogrammes, nuages de points, courbes de tendance.'
    },
    {
      icon: 'grid',
      title: 'Dashboard Personnalisé',
      description: 'Suivez vos activités avec un tableau de bord complet et des statistiques en temps réel.'
    }
  ];

  steps = [
    {
      number: '01',
      title: 'Importez vos données',
      description: 'Ajoutez vos fichiers CSV ou JSON en quelques clics'
    },
    {
      number: '02',
      title: 'Explorez et analysez',
      description: 'Lancez des analyses statistiques avancées sur vos datasets'
    },
    {
      number: '03',
      title: 'Visualisez les résultats',
      description: 'Consultez des graphiques interactifs et des rapports détaillés'
    },
    {
      number: '04',
      title: 'Suivez votre activité',
      description: 'Accédez à votre dashboard pour une vue d\'ensemble complète'
    }
  ];

  stats = [
    { value: '500+', label: 'Utilisateurs actifs' },
    { value: '10K+', label: 'Analyses effectuées' },
    { value: '5K+', label: 'Datasets traités' },
    { value: '99.9%', label: 'Disponibilité' }
  ];

  onSubmit() {
    if (this.email) {
      console.log('Email soumis:', this.email);
      // Redirection vers la page d'inscription avec l'email pré-rempli
      // this.router.navigate(['/register'], { queryParams: { email: this.email } });
    }
  }
}