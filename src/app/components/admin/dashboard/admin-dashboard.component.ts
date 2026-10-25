import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '@ngx-translate/core';

import { OrderService } from '../../../services/order.service';
import { LanguageService } from '../../../services/language.service';
import {
  MonthlyVisitors,
  WebsiteVisitService
} from '../../../services/website-visit.service';
import { SMSService } from '../../../services/otp.service';


// Price of one SMS part, used for the SMS cost card.
const SMS_PART_PRICE = 0.60;


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

 private readonly visitorService =
    inject(WebsiteVisitService);

     private readonly SmsService =
    inject(SMSService);
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
  totalCost=signal(0);
totalMsg=signal(0);
  totalOrders =
    signal(0);

  totalSales =
    signal(0);

  totalGain =
    signal(0);
visitors=signal(0);


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

    this.errorMessage.set('');

    this.loadTotalCost();

    this.loadDashboard();

  }


  // ============================================================
  // PENDING REQUESTS
  // ------------------------------------------------------------
  // One shared counter for all 4 dashboard requests, so the
  // loading state ends only when the LAST one finishes.
  // ============================================================

  private pendingRequests = 0;

  private requestStarted(): void {
    this.pendingRequests++;
    this.isLoading.set(true);
  }

  private requestCompleted(): void {
    this.pendingRequests = Math.max(0, this.pendingRequests - 1);

    if (this.pendingRequests === 0) {
      this.isLoading.set(false);
    }
  }


  // ============================================================
  // SMS COST
  // ============================================================

 loadTotalCost(): void {

  this.requestStarted();

  this.SmsService.getTotalCost().subscribe({
    next: stats => {
      if (stats?.success) {
        const parts = Number(stats.data?.totalSmsPartCount) || 0;

        this.totalCost.set(parts * SMS_PART_PRICE);
        this.totalMsg.set(parts);
      }

      this.requestCompleted();
    },

    error: () => {
      this.errorMessage.set(
        'dashboard.errors.smsCost'
      );

      this.requestCompleted();
    }
  });

}

  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

 loadDashboard(): void {

  const requestCompleted = () => this.requestCompleted();

  this.requestStarted();
  this.requestStarted();
  this.requestStarted();

  this.orderService.getCurrentMonthStats().subscribe({
    next: stats => {
      this.monthlyOrders.set(stats.orders);
      this.monthlySales.set(stats.sales);
      this.monthlyGain.set(stats.gain);

      requestCompleted();
    },

    error: () => {
      this.errorMessage.set(
        'dashboard.errors.monthStats'
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
        'dashboard.errors.totalStats'
      );

      requestCompleted();
    }
  });
   this.visitorService.getMonthlyVisitors().subscribe({
    next: (res: MonthlyVisitors[] | MonthlyVisitors | null) => {
      this.visitors.set(this.getCurrentMonthVisitors(res));

      requestCompleted();
    },

    error: () => {
      this.errorMessage.set(
        'dashboard.errors.visitors'
      );

      requestCompleted();
    }
  });
}
  // ============================================================
  // CURRENT MONTH VISITORS
  // ------------------------------------------------------------
  // /WebsiteVisits/monthly returns one entry per month
  // ([{ year, month, visitors }]). Pick the current month.
  // A single object is also accepted, in case the API changes.
  // ============================================================

  private getCurrentMonthVisitors(
    res: MonthlyVisitors[] | MonthlyVisitors | null
  ): number {

    if (Array.isArray(res)) {

      const current = res.find(
        entry =>
          Number(entry.year) === this.currentYear &&
          Number(entry.month) === this.currentMonth
      );

      return Number(current?.visitors) || 0;
    }

    return Number(res?.visitors) || 0;
  }


  // ============================================================
  // MONTH NAME (follows the language switch)
  // ============================================================

  private readonly languageService =
    inject(LanguageService);

  readonly currentMonthName =
    computed(() =>
      new Intl.DateTimeFormat(
        this.languageService.currentLanguage() === 'ar'
          ? 'ar-EG'
          : 'en-US',
        {
          month: 'long'
        }
      ).format(new Date())
    );

}