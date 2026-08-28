import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';



// ============================================================
// SERVICE
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    environment.apiBaseUrl+'/Products';


  // ==========================================================
  // GET ALL
  // ==========================================================

  getProducts():
    Observable<Product[]> {

    return this.http.get<Product[]>(
      this.apiUrl
    );
  }


  // ==========================================================
  // GET BY ID
  // ==========================================================

  getProduct(
    id: number
  ): Observable<Product> {

    return this.http.get<Product>(
      `${this.apiUrl}/${id}`
    );
  }


  // ==========================================================
  // CREATE
  // ==========================================================

  createProduct(
    formData: FormData
  ): Observable<Product> {

    return this.http.post<Product>(
      this.apiUrl,
      formData
    );
  }


  // ==========================================================
  // UPDATE
  // ==========================================================

  updateProduct(
    id: number,
    formData: FormData
  ): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/${id}`,
      formData
    );
  }


  // ==========================================================
  // DELETE
  // ==========================================================

  deleteProduct(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }


  // ==========================================================
  // CHECK EXISTS
  // ==========================================================

  checkProductExists(
    name: string
  ): Observable<boolean> {

    return this.http.get<boolean>(
      `${this.apiUrl}/exists`,
      {
        params: {
          name
        }
      }
    );
  }
}