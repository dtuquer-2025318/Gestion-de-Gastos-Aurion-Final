import { Component, inject, OnInit, NgZone, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private ngZone = inject(NgZone);
  private isInitialized = false;
  private platformId = inject(PLATFORM_ID);

  loginForm!: FormGroup;
  errorMessage = '';
  successMessage = '';
  sessionExpiredMessage = '';
  inactivityExpiredMessage = '';
  idleExpiredMessage = '';
  loading = false;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.route.queryParams.subscribe((params) => {
      if (params['registered'] === 'true') {
        this.successMessage = 'Registro exitoso. Por favor inicie sesión con sus credenciales.';
      }
      if (params['sessionExpired'] === 'true') {
        this.sessionExpiredMessage = 'La sesión ha expirado. Por favor inicie sesión nuevamente.';
      }
      if (params['inactivityExpired'] === 'true') {
        this.inactivityExpiredMessage = 'Su sesión se cerró por inactividad. Por favor inicie sesión nuevamente.';
      }
      if (params['idleExpired'] === 'true') {
        this.idleExpiredMessage = 'Su sesión se cerró por inactividad. No se detectó interacción durante un tiempo prolongado.';
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      this.initGoogleSignIn();
    }
  }

  private initGoogleSignIn(): void {
    setTimeout(() => {
      if (typeof google !== 'undefined' && !this.isInitialized) {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleResponse(response),
        });

        google.accounts.id.renderButton(
          document.getElementById('googleBtnWrapper'),
          { theme: 'outline', size: 'large', width: 350, text: 'signin_with' }
        );

        this.isInitialized = true;
      }
    }, 500);
  }


  private handleGoogleResponse(response: any): void {
    if (!response.credential) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.googleLogin(response.credential).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err: HttpErrorResponse) => {
        this.ngZone.run(() => {
          this.loading = false;
          if (err.status === 409) {
            this.errorMessage = err.error?.message;
          } else {
            this.errorMessage = err.error?.message || 'No se pudo iniciar sesión con Google. Intente nuevamente.';
          }
        });
      }
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.sessionExpiredMessage = '';
    this.inactivityExpiredMessage = '';
    this.idleExpiredMessage = '';

    const credentials = this.loginForm.getRawValue();

    this.loginForm.disable();

    this.authService.login(credentials).subscribe({
      next: () => {
        this.loading = false;
        this.loginForm.get('password')?.setValue('');
        this.loginForm.enable();
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.loginForm.get('password')?.setValue('');
        this.loginForm.enable();
        
        if (err.status === 401) {
          this.errorMessage = 'Credenciales incorrectas. Verifique su correo electrónico y contraseña.';
        } else if (err.status === 429) {
          this.errorMessage = 'Demasiados intentos. Por favor espere unos minutos.';
        } else if (err.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
        } else {
          this.errorMessage = err.error?.message || 'Ocurrió un error inesperado. Intente más tarde.';
        }
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}