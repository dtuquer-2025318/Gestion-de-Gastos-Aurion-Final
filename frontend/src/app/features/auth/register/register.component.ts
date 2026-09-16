import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators, } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const COMMON_PASSWORDS = [
  '123456', 'password', 'qwerty', '111111', '12345678',
  'abc123', 'password123', '123456789', '1234567890', 'admin', 'aurion'
];

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    if (COMMON_PASSWORDS.includes(value.toLowerCase())) {
      return { weakPassword: 'Tu contraseña es muy débil. Usa una combinación de letras y números.' };
    }

    if (/^\d+$/.test(value)) {
      return { weakPassword: 'Tu contraseña es muy débil. Usa una combinación de letras y números.' };
    }

    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSymbol = /[^A-Za-z0-9]/.test(value);

    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      return { weakPassword: 'Usa mayúsculas, minúsculas, números y símbolos especiales.' };
    }

    return null;
  };
}

export function minimumAgeValidator(minAge: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= minAge ? null : { underAge: true };
  };
}

export function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  registerForm!: FormGroup;
  errorMessage = '';
  loading = false;

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(30),
            Validators.pattern(/^[a-zA-Z0-9_.-]+$/),
          ],
        ],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
        gender: ['', [Validators.required]],
        birthDate: ['', [Validators.required, minimumAgeValidator(18)]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(128),
            passwordStrengthValidator(),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator }
    );
  }

  get f() {
    return this.registerForm.controls;
  }

  get passwordErrorMessage(): string {
    const ctrl = this.f['password'];
    if (!ctrl || !ctrl.errors || !ctrl.touched) return '';

    if (ctrl.errors['required']) return 'La contraseña es obligatoria.';
    if (ctrl.errors['minlength']) return 'Debe tener al menos 8 caracteres.';
    if (ctrl.errors['maxlength']) return 'No puede exceder 128 caracteres.';
    if (ctrl.errors['weakPassword']) return ctrl.errors['weakPassword'] as string;

    return '';
  }

  onSubmit(): void {
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.registerForm.disable();

    const formRawValues = this.registerForm.getRawValue();
    // Excluimos confirmPassword del payload que va hacia la API
    const { confirmPassword, ...registerPayload } = formRawValues;

    this.authService.register(registerPayload).subscribe({
      next: () => {
        this.loading = false;
        this.registerForm.enable();
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' },
          replaceUrl: true,
        });
      },
      error: (err: any) => {
        this.loading = false;
        this.registerForm.enable();
        this.errorMessage = err.error?.message || 'Error al procesar el registro.';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}