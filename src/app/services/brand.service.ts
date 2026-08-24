import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  Brand
} from '../models/Brand.model';

import {
  environment
} from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class BrandService {

  private apiUrl =
    environment.apiBaseUrl + '/brands';


  constructor(
    private http: HttpClient
  ) {}


  // =====================================================
  // GET ALL
  // =====================================================

  getBrands(): Observable<Brand[]> {

    return this.http.get<Brand[]>(
      this.apiUrl
    );

  }


  // =====================================================
  // GET BY ID
  // =====================================================

  getBrand(
    id: number
  ): Observable<Brand> {

    return this.http.get<Brand>(
      `${this.apiUrl}/${id}`
    );

  }


  // =====================================================
  // CREATE
  // =====================================================

  addBrand(
    brand: FormData
  ): Observable<Brand> {

    return this.http.post<Brand>(
      this.apiUrl,
      brand
    );

  }


  // =====================================================
  // UPDATE
  // =====================================================

  updateBrand(
    id: number,
    brand: FormData
  ): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      brand
    );

  }


  // =====================================================
  // DELETE
  // =====================================================

  deleteBrand(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );

  }

}