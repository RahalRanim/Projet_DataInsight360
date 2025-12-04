import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  resetForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  loading = false;
  verifying = true;
  codeValid = false;
  showPassword = false;
  showConfirmPassword = false;
  
  oobCode: string = ''; // Le code de réinitialisation de l'URL
  userEmail: string = '';

  constructor() {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Récupérer le code de l'URL (mode=resetPassword&oobCode=xxx)
    this.route.queryParams.subscribe(params => {
      const mode = params['mode'];
      this.oobCode = params['oobCode'] || '';

      if (mode === 'resetPassword' && this.oobCode) {
        this.verifyCode();
      } else {
        this.verifying = false;
        this.errorMessage = 'Lien invalide ou expiré.';
      }
    });
  }

  // Vérifier si le code est valide
  verifyCode(): void {
    this.authService.verifyPasswordResetCode(this.oobCode).subscribe({
      next: (email) => {
        this.userEmail = email;
        this.codeValid = true;
        this.verifying = false;
      },
      error: (error) => {
        this.verifying = false;
        this.codeValid = false;
        
        if (error.code === 'auth/invalid-action-code') {
          this.errorMessage = 'Ce lien a expiré ou a déjà été utilisé.';
        } else if (error.code === 'auth/expired-action-code') {
          this.errorMessage = 'Ce lien a expiré. Demandez un nouveau lien.';
        } else {
          this.errorMessage = 'Erreur lors de la vérification du lien.';
        }
      }
    });
  }

  // Validateur pour vérifier que les mots de passe correspondent
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.resetForm.valid && this.codeValid) {
      this.loading = true;
      this.errorMessage = '';
      
      const { password } = this.resetForm.value;
      
      this.authService.confirmPasswordReset(this.oobCode, password).subscribe({
        next: () => {
          this.successMessage = 'Mot de passe réinitialisé avec succès ! Redirection...';
          this.loading = false;
          
          // Rediriger vers login après 3 secondes
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.loading = false;
          console.error('Erreur:', error);
          
          if (error.code === 'auth/weak-password') {
            this.errorMessage = 'Le mot de passe est trop faible.';
          } else if (error.code === 'auth/invalid-action-code') {
            this.errorMessage = 'Ce lien a expiré ou a déjà été utilisé.';
          } else {
            this.errorMessage = 'Erreur lors de la réinitialisation. Réessayez.';
          }
        }
      });
    }
  }

  get password() {
    return this.resetForm.get('password');
  }

  get confirmPassword() {
    return this.resetForm.get('confirmPassword');
  }
}