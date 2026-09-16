import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Order, PagedResponse } from '../models/order.model';
import { DashboardStats } from '../models/DashboardStats.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    environment.apiBaseUrl + '/orders';


  // ============================================================
  // ORDERS
  // ============================================================
/* getOrders(
  page: number = 1,
  pageSize: number = 1
): Observable<PagedResponse<Order>> {

  return this.http.get<PagedResponse<Order>>(
    `${environment.apiBaseUrl}/orders`,
    {
      params: {
        page,
        pageSize
      }
    }
  );
} */

getOrders(
  page: number,
  pageSize: number,
  orderId?: number | null,
  status?: string | null
): Observable<PagedResponse<Order>> {

  let params = new HttpParams()
    .set('page', page)
    .set('pageSize', pageSize);


  if (orderId) {

    params = params.set(
      'orderId',
      orderId
    );

  }


  if (status) {

    params = params.set(
      'status',
      status
    );

  }


  return this.http.get<PagedResponse<Order>>(
    `${environment.apiBaseUrl}/orders`,
    { params }
  );

}
  cancelOrder(
    id: number
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${id}/cancel`,
      {}
    );

  }
completeOrder(
    id: number
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${id}/complete`,
      {}
    );

  }

  // ============================================================
  // DASHBOARD
  // ============================================================

getCurrentMonthStats(): Observable<DashboardStats> {
  return this.http.get<DashboardStats>(
    `${this.apiUrl}/dashboard/current-month`
  );
}

getTotalStats(): Observable<DashboardStats> {
  return this.http.get<DashboardStats>(
    `${this.apiUrl}/dashboard/total`
  );
}
}