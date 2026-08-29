
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
// PAGED RESPONSE
// ============================================================

export interface PagedResponse<T> {

  items: T[];

  page: number;

  pageSize: number;

  totalCount: number;

  totalPages: number;

  hasMore: boolean;
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
    environment.apiBaseUrl + '/Products';
//============================================
// get product by nam e
//=============================================
getProductsByName(
  name: string
): Observable<Product[]> {

  return this.http.get<Product[]>(
    `${this.apiUrl}/search`,
    {
      params: {
        name
      }
    }
  );
}

  // ==========================================================
  // GET PRODUCTS
  // ==========================================================
  //
  // Backend:
  //
  // GetProducts(
  //     int page = 1,
  //     int? categoryId = null,
  //     int? subCategoryId = null,
  //     int? brandId = null,
  //     bool? offers = null
  // )
  //
  // No filters:
  //
  // GET /Products?page=1
  //
  // With filters:
  //
  // GET /Products?page=1&categoryId=2&brandId=5
  //
  // ==========================================================

  getProducts(
    page: number = 1,
    categoryId: number | null = null,
    subCategoryId: number | null = null,
    brandId: number | null = null,
    offers: boolean = false
  ): Observable<PagedResponse<Product>> {

    const params: Record<string, string> = {
      page: page.toString()
    };


    if (categoryId !== null) {
      params['categoryId'] =
        categoryId.toString();
    }


    if (subCategoryId !== null) {
      params['subCategoryId'] =
        subCategoryId.toString();
    }


    if (brandId !== null) {
      params['brandId'] =
        brandId.toString();
    }


    if (offers) {
      params['offers'] = 'true';
    }


    return this.http.get<PagedResponse<Product>>(
      this.apiUrl,
      {
        params
      }
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
      `${this.apiUrl}/check-name`,
      {
        params: {
          name
        }
      }
    );
  }
}
