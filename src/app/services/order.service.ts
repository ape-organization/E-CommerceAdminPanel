import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    environment.apiBaseUrl+'/orders';


  getOrders(): Observable<Order[]> {

    return this.http.get<Order[]>(
      this.apiUrl
    );

  }


  getOrder(id: number): Observable<Order> {

    return this.http.get<Order>(
      `${this.apiUrl}/${id}`
    );

  }


  updateStatus(
    id: number,
    status: string
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${id}/status`,
      JSON.stringify(status),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
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

}