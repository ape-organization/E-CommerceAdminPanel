import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '@ngx-translate/core';

import { OrderService } from '../../../services/order.service';
import { LanguageService } from '../../../services/language.service';


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,

  imports: [
    CommonModule,
    MatIconModule,
    TranslatePipe
  ],

  templateUrl: './admin-dashboard.component.html',

  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {

  private readonly orderService =
    inject(OrderService);


  // ============================================================
  // CURRENT DATE
  // ============================================================

  readonly currentYear =
    new Date().getFullYear();

  readonly currentMonth =
    new Date().getMonth() + 1;




  // ============================================================
  // MONTHLY VALUES
  // ============================================================

  monthlyOrders =
    signal(0);

  monthlySales =
    signal(0);

  monthlyGain =
    signal(0);


  // ============================================================
  // TOTAL VALUES
  // ============================================================

  totalOrders =
    signal(0);

  totalSales =
    signal(0);

  totalGain =
    signal(0);


  // ============================================================
  // LOADING
  // ============================================================

  isLoading =
    signal(false);


  // ============================================================
  // ERROR
  // ============================================================

  errorMessage =
    signal('');


  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {

    this.loadDashboard();

  }


  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

 loadDashboard(): void {
  this.isLoading.set(true);
  this.errorMessage.set('');

  let completed = 0;

  const requestCompleted = () => {
    completed++;

    if (completed === 2) {
      this.isLoading.set(false);
    }
  };

  this.orderService.getCurrentMonthStats().subscribe({
    next: stats => {
      this.monthlyOrders.set(stats.orders);
      this.monthlySales.set(stats.sales);
      this.monthlyGain.set(stats.gain);

      requestCompleted();
    },

    error: () => {
      this.errorMessage.set(
        'Failed to load current month statistics.'
      );

      requestCompleted();
    }
  });

  this.orderService.getTotalStats().subscribe({
    next: stats => {
      this.totalOrders.set(stats.orders);
      this.totalSales.set(stats.sales);
      this.totalGain.set(stats.gain);

      requestCompleted();
    },

    error: () => {
      this.errorMessage.set(
        'Failed to load total statistics.'
      );

      requestCompleted();
    }
  });
}
// transalte month 
private readonly languageService=inject(LanguageService)
get currentMonthName(): string {
  const language = this.languageService.currentLanguage();

  return new Intl.DateTimeFormat(
    language === 'ar' ? 'ar-EG' : 'en-US',
    {
      month: 'long'
    }
  ).format(new Date());
}
  // ============================================================
  // ERROR HANDLER
  // ============================================================

  private handleError(error: any): void {

    console.error(
      'Dashboard error:',
      error
    );

    if (!this.errorMessage()) {

      this.errorMessage.set(
        error?.error?.message ??
        'Unable to load dashboard data.'
      );

    }

  }

}