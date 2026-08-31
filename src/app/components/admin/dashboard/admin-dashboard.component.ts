import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import { OrderService } from '../../../services/order.service';
import { TranslatePipe } from '@ngx-translate/core';

interface DashboardOrder {
  id: number;
  status: string;
  totalAmount: number;
}

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

  private readonly orderService = inject(OrderService);

  // ============================================================
  // VALUES
  // ============================================================

  totalSales =signal(0) ;

  totalRevenue = signal(0);

  partnerShare = signal(0);

  yourShare = signal(0);

  errorMessage = '';

  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {

    console.log('🔥 Dashboard initialized');

    this.loadDashboard();

  }

  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  private loadDashboard(): void {

    console.log('🟡 Loading orders...');

    this.orderService.getOrders().subscribe({

      next: (orders: any[]) => {

        console.log('🟢 ORDERS RECEIVED:', orders);

        const validOrders =
          (orders ?? []).filter(order =>
            order.status?.toLowerCase() !== 'cancelled'
          );

        this.totalSales.set(
          validOrders.length);

        this.totalRevenue .set(
          validOrders.reduce(
            (total, order) =>
              total + Number(order.totalAmount || 0),
            0
          ));

        this.partnerShare .set(
          this.totalRevenue() * 0.30);

        this.yourShare .set(
          this.totalRevenue() * 0.70);

        console.log('🟢 DASHBOARD VALUES:', {
          totalSales: this.totalSales,
          totalRevenue: this.totalRevenue,
          partnerShare: this.partnerShare,
          yourShare: this.yourShare
        });

      },

      error: (error) => {

        console.error(
          '🔴 Dashboard error:',
          error
        );

        this.errorMessage =
          error?.error?.message ??
          'Unable to load dashboard data.';

      },

      complete: () => {

        console.log(
          '🔵 Dashboard request completed'
        );

      }

    });

  }

}