import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  forgotPasswordForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const { email } = this.forgotPasswordForm.value;
      
      this.authService.resetPassword(email).subscribe({
        next: () => {
          this.successMessage = 'Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception.';
          this.loading = false;
          this.forgotPasswordForm.reset();
          
          // Rediriger vers login après 5 secondes
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 5000);
        },
        error: (error) => {
          this.loading = false;
          console.error('Erreur:', error);
          
          if (error.code === 'auth/user-not-found') {
            this.errorMessage = 'Aucun compte associé à cet email.';
          } else if (error.code === 'auth/invalid-email') {
            this.errorMessage = 'Adresse email invalide.';
          } else if (error.code === 'auth/too-many-requests') {
            this.errorMessage = 'Trop de tentatives. Réessayez plus tard.';
          } else {
            this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
          }
        }
      });
    }
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }
}