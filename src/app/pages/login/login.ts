import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  errorMessage = '';
  loading = false;
  showPassword = false;
  
  // Gestion des tentatives
  loginAttempts = 0;
  maxAttempts = 3;
  isBlocked = false;
  blockDuration = 1 * 60 * 1000; // 1 minute en millisecondes
  remainingTime = 0;
  private blockTimer?: any;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.checkBlockStatus();
  }

  ngOnDestroy(): void {
    if (this.blockTimer) {
      clearInterval(this.blockTimer);
    }
  }

  // Vérifier si le compte est bloqué
  private checkBlockStatus(): void {
    const blockData = localStorage.getItem('loginBlock');
    if (blockData) {
      const { blockedUntil, attempts } = JSON.parse(blockData);
      const now = Date.now();
      
      if (now < blockedUntil) {
        this.isBlocked = true;
        this.loginAttempts = attempts;
        this.startBlockTimer(blockedUntil - now);
      } else {
        // Le blocage est expiré
        localStorage.removeItem('loginBlock');
        this.resetAttempts();
      }
    }
  }

  // Démarrer le timer de blocage
  private startBlockTimer(duration: number): void {
    this.remainingTime = Math.ceil(duration / 1000);
    
    this.blockTimer = setInterval(() => {
      this.remainingTime--;
      
      if (this.remainingTime <= 0) {
        this.unblockAccount();
      }
    }, 1000);
  }

  // Débloquer le compte
  private unblockAccount(): void {
    this.isBlocked = false;
    this.resetAttempts();
    localStorage.removeItem('loginBlock');
    if (this.blockTimer) {
      clearInterval(this.blockTimer);
    }
    this.errorMessage = '';
  }

  // Réinitialiser les tentatives
  private resetAttempts(): void {
    this.loginAttempts = 0;
  }

  // Bloquer le compte
  private blockAccount(): void {
    this.isBlocked = true;
    const blockedUntil = Date.now() + this.blockDuration;
    
    localStorage.setItem('loginBlock', JSON.stringify({
      blockedUntil,
      attempts: this.loginAttempts
    }));
    
    this.errorMessage = 'Compte bloqué temporairement. Réessayez plus tard.';
    this.startBlockTimer(this.blockDuration);
  }

  // Formater le temps restant
  getFormattedTime(): string {
    const minutes = Math.floor(this.remainingTime / 60);
    const seconds = this.remainingTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // ✅ MÉTHODE MODIFIÉE : Redirection basée sur le rôle
  onSubmit(): void {
    if (this.loginForm.valid && !this.isBlocked) {
      this.loading = true;
      this.errorMessage = '';
      
      const { email, password } = this.loginForm.value;
      
      this.authService.login(email, password).subscribe({
        next: () => {
          this.resetAttempts();
          localStorage.removeItem('loginBlock');
          
          // ✅ Récupérer le profil utilisateur pour vérifier le rôle
          const userProfile = this.authService.getUserProfile();
          
          // ✅ Redirection basée sur le rôle
          if (userProfile?.role === 'admin') {
            console.log('Redirection vers dashboard admin');
            this.router.navigate(['/home/dashboard']);
          } else {
            console.log('Redirection vers dashboard data scientist');
            this.router.navigate(['/data-scientist/dashboard']);
          }
        },
        error: (error) => {
          this.loading = false;
          this.loginAttempts++;
          
          if (this.loginAttempts >= this.maxAttempts) {
            this.blockAccount();
          } else {
            const remainingAttempts = this.maxAttempts - this.loginAttempts;
            
            // Messages d'erreur plus spécifiques
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
              this.errorMessage = `Email ou mot de passe incorrect. ${remainingAttempts} tentative(s) restante(s).`;
            } else if (error.code === 'auth/user-not-found') {
              this.errorMessage = `Aucun compte trouvé avec cet email. ${remainingAttempts} tentative(s) restante(s).`;
            } else if (error.code === 'auth/too-many-requests') {
              this.errorMessage = 'Trop de tentatives. Compte temporairement bloqué.';
              this.blockAccount();
            } else {
              this.errorMessage = `Identifiants incorrects. ${remainingAttempts} tentative(s) restante(s).`;
            }
          }
        }
      });
    }
  }
}