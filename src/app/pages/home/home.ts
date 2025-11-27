import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  sidebarOpen = false;
  isMobile = false;
  private resizeListener!: () => void;

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkScreenSize();
    this.resizeListener = this.onResize.bind(this);
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
    // Nettoyer le style du body
    document.body.style.overflow = '';
    document.body.classList.remove('sidebar-open-mobile');
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
    
    // Fermer la sidebar automatiquement quand on passe en desktop
    if (window.innerWidth > 768 && this.sidebarOpen) {
      this.sidebarOpen = false;
      this.updateBodyStyles();
    }
  }

  private checkScreenSize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    
    // Réinitialiser l'état sur changement de mode
    if (wasMobile && !this.isMobile && this.sidebarOpen) {
      this.sidebarOpen = false;
      this.updateBodyStyles();
    }
  }

  toggleSidebar() {
    console.log('Toggle sidebar clicked, current state:', this.sidebarOpen);
    this.sidebarOpen = !this.sidebarOpen;
    this.updateBodyStyles();
  }

  closeSidebarOnMobile() {
    if (this.isMobile && this.sidebarOpen) {
      this.sidebarOpen = false;
      this.updateBodyStyles();
    }
  }

  private updateBodyStyles() {
    if (this.isMobile) {
      if (this.sidebarOpen) {
        document.body.style.overflow = 'hidden';
        document.body.classList.add('sidebar-open-mobile');
      } else {
        document.body.style.overflow = '';
        document.body.classList.remove('sidebar-open-mobile');
      }
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('sidebar-open-mobile');
    }
  }

  logout() {
    // Fermer la sidebar sur mobile avant la déconnexion
    this.closeSidebarOnMobile();
    
    // Implémentation de la déconnexion
    console.log('Déconnexion...');
    // this.authService.logout();
    // this.router.navigate(['/login']);
  }

  // Méthode pour gérer les clics en dehors de la sidebar
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.sidebarOpen && this.isMobile) {
      const sidebar = document.querySelector('.side-bar') as HTMLElement;
      const mobileToggle = document.querySelector('.mobile-menu-toggle') as HTMLElement;
      
      // Si on clique en dehors de la sidebar et du bouton toggle mobile
      if (sidebar && !sidebar.contains(event.target as Node) && 
          mobileToggle && !mobileToggle.contains(event.target as Node)) {
        this.closeSidebarOnMobile();
      }
    }
  }

  // Gestion du clavier pour l'accessibilité
  @HostListener('document:keydown.escape')
  onEscapePress() {
    if (this.sidebarOpen) {
      this.closeSidebarOnMobile();
    }
  }
}