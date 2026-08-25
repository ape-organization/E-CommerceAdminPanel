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


// ============================================================
// MODELS
// ============================================================

export interface SubCategoryResponse {

  id: number;

  name: string;

  categoryId: number;

  categoryName: string;
}


export interface ProductResponse {

  id: number;

  name: string;

  description: string | null;

  price: number;
isInStock: boolean;
  stockQuantity: number;

  imageUrl: string | null;

  subCategories: SubCategoryResponse[];
}


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
    Observable<ProductResponse[]> {

    return this.http.get<ProductResponse[]>(
      this.apiUrl
    );
  }


  // ==========================================================
  // GET BY ID
  // ==========================================================

  getProduct(
    id: number
  ): Observable<ProductResponse> {

    return this.http.get<ProductResponse>(
      `${this.apiUrl}/${id}`
    );
  }


  // ==========================================================
  // CREATE
  // ==========================================================

  createProduct(
    formData: FormData
  ): Observable<ProductResponse> {

    return this.http.post<ProductResponse>(
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