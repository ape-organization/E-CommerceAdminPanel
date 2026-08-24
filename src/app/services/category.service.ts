import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Category } from '../models/category.model';

import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private apiUrl =
    environment.apiBaseUrl + '/categories';


  constructor(
    private http: HttpClient
  ) {}


  // =====================================================
  // GET ALL CATEGORIES
  // =====================================================

  getCategories(): Observable<Category[]> {

    return this.http.get<Category[]>(
      this.apiUrl
    );

  }


  // =====================================================
  // GET CATEGORY BY ID
  // =====================================================

  getCategory(id: number): Observable<Category> {

    return this.http.get<Category>(
      `${this.apiUrl}/${id}`
    );

  }


  // =====================================================
  // GET MENU
  // =====================================================

  getCategoriesForMenu(): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.apiUrl}/menu`
    );

  }


  // =====================================================
  // CREATE CATEGORY
  // =====================================================

  addCategory(
    category: FormData
  ): Observable<Category> {

    return this.http.post<Category>(
      this.apiUrl,
      category
    );

  }


  // =====================================================
  // UPDATE CATEGORY
  // =====================================================

  updateCategory(
    id: number,
    category: FormData
  ): Observable<Category> {

    return this.http.put<Category>(
      `${this.apiUrl}/${id}`,
      category
    );

  }


  // =====================================================
  // DELETE CATEGORY
  // =====================================================

  deleteCategory(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );

  }

}