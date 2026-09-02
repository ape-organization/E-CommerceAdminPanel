import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SubCategory } from '../models/subCategory.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    environment.apiBaseUrl+'/subCategory';


  // =========================================================
  // GET ALL SUBCATEGORIES
  // GET: api/SubCategory
  // =========================================================

  getAll(): Observable<SubCategory[]> {

    return this.http.get<SubCategory[]>(
      this.apiUrl
    );

  }


  // =========================================================
  // GET SUBCATEGORY BY ID
  // GET: api/SubCategory/5
  // =========================================================

  getById(id: number): Observable<SubCategory> {

    return this.http.get<SubCategory>(
      `${this.apiUrl}/${id}`
    );

  }


  // =========================================================
  // GET SUBCATEGORIES BY CATEGORY
  // GET: api/SubCategory/category/2
  // =========================================================

  getByCategoryId(
    categoryId: number
  ): Observable<SubCategory[]> {

    return this.http.get<SubCategory[]>(
      `${this.apiUrl}/category/${categoryId}`
    );

  }


  // =========================================================
  // CREATE SUBCATEGORY
  // POST: api/SubCategory
  // =========================================================

  create(
    data:any
  ): Observable<SubCategory> {

    return this.http.post<SubCategory>(
      this.apiUrl,
      data
    );

  }


  // =========================================================
  // UPDATE SUBCATEGORY
  // PUT: api/SubCategory/5
  // =========================================================

  update(
    id: number,
    data: {
      nameEn: string;
      nameAr:string;
      categoryId: number;
    }
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${id}`,
      data
    );

  }


  // =========================================================
  // DELETE SUBCATEGORY
  // DELETE: api/SubCategory/5
  // =========================================================

  delete(
    id: number
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/${id}`
    );

  }


  // =========================================================
  // ADD PRODUCT TO SUBCATEGORY
  //
  // POST:
  // api/SubCategory/5/products/10
  // =========================================================

  addProduct(
    subCategoryId: number,
    productId: number
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/${subCategoryId}/products/${productId}`,
      {}
    );

  }


  // =========================================================
  // REMOVE PRODUCT FROM SUBCATEGORY
  //
  // DELETE:
  // api/SubCategory/5/products/10
  // =========================================================

  removeProduct(
    subCategoryId: number,
    productId: number
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/${subCategoryId}/products/${productId}`
    );

  }


  // =========================================================
  // SET ALL PRODUCTS FOR SUBCATEGORY
  //
  // PUT:
  // api/SubCategory/5/products
  //
  // Body:
  // [1, 4, 7]
  // =========================================================

  setProducts(
    subCategoryId: number,
    productIds: number[]
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${subCategoryId}/products`,
      productIds
    );

  }

}