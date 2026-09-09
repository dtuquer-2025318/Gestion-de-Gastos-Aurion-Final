import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatCard {
  title: string;
  value: string;
  icon: string;
}

interface BarGroup {
  label: string;
  blue: number;
  purple: number;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class InicioComponent {
  stats: StatCard[] = [
    { title: 'SALDO TOTAL',     value: 'Q. 12,000', icon: '/icons/saldo.png' },
    { title: 'GASTOS TOTALES',  value: 'Q. 14,357', icon: '/icons/gastos.png' },
    { title: 'AHORROS TOTALES', value: 'Q. 1,000',  icon: '/icons/ahorros.png' }
  ];

  barData: BarGroup[] = [
    { label: 'Ene', blue: 4000, purple: 2500 },
    { label: 'Feb', blue: 3200, purple: 1700 },
    { label: 'Mar', blue: 2200, purple: 1200 }
  ];
}