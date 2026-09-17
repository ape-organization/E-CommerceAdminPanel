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
export class SMSService {

  private apiUrl =
    environment.apiBaseUrl + '/Sms';


  constructor(
    private http: HttpClient
  ) {}


  // =====================================================
  // GET ALL
  // =====================================================

  getTotalCost(): Observable<any> {

    return this.http.get<any>(
      this.apiUrl+'/cost'
    );

  }

}