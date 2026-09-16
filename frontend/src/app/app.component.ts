import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { catchError, EMPTY } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'AURION';
  private authService = inject(AuthService);

  ngOnInit(): void {
    // Verifica y sincroniza el rol/estado del usuario con PostgreSQL al recargar
    if (this.authService.getToken()) {
      this.authService.getProfile().pipe(
        catchError(() => {
          // Si el servidor falla (ej. 500) o el token expiró (401), limpia la sesión
          this.authService.logout();
          return EMPTY; // Silencia el error en consola
        })
      ).subscribe();
    }
  }
}