import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Category } from '../models/category.model';

import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class SliderService {

  private apiUrl =
    environment.apiBaseUrl + '/slider';


  constructor(
    private http: HttpClient
  ) {}


  // =====================================================
  // GET ALL CATEGORIES
  // =====================================================

  getSliders(): Observable<any> {

    return this.http.get<any>(
      this.apiUrl
    );

  }

  // =====================================================
  // CREATE CATEGORY
  // =====================================================

  addSlider(
    slider: FormData
  ): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      slider
    );

  }


  // =====================================================
  // UPDATE CATEGORY
  // =================================================

  updateSlider(
    id: number,
    slider: FormData
  ): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      slider
    );

  }

}