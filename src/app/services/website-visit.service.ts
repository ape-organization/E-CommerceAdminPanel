import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';


/* ============================================================
   MODELS
   ============================================================ */

export interface WebsiteVisitorStats {
  today: number;
  thisMonth: number;
  total: number;
}

export interface MonthlyVisitors {
  year: number;
  month: number;
  visitors: number;
}


/* ============================================================
   SERVICE
   ============================================================ */

@Injectable({
  providedIn: 'root'
})
export class WebsiteVisitService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiBaseUrl}/WebsiteVisits`;

  private readonly visitorIdKey =
    'website_visitor_id';


  /* ==========================================================
     GET / CREATE VISITOR ID
     ========================================================== */

  private getVisitorId(): string {

    let visitorId =
      localStorage.getItem(this.visitorIdKey);

    if (!visitorId) {

      visitorId = crypto.randomUUID();

      localStorage.setItem(
        this.visitorIdKey,
        visitorId
      );
    }

    return visitorId;
  }


  /* ==========================================================
     RECORD VISIT
     ========================================================== */

  trackVisit(): Observable<void> {

    const visitorId =
      this.getVisitorId();

    return this.http.post<void>(
      this.apiUrl,
      {
        visitorId
      }
    );
  }


  /* ==========================================================
     GET CURRENT VISITOR STATISTICS
     
     Returns:
     - today
     - thisMonth
     - total
     ========================================================== */

  getStats(): Observable<WebsiteVisitorStats> {

    return this.http.get<WebsiteVisitorStats>(
      `${this.apiUrl}/stats`
    );
  }


  /* ==========================================================
     GET MONTHLY VISITORS
     
     Example:
     getMonthlyVisitors()
     getMonthlyVisitors(6)
     getMonthlyVisitors(12)
     ========================================================== */

  getMonthlyVisitors(
    months: number = 12
  ): Observable<MonthlyVisitors[]> {

    return this.http.get<MonthlyVisitors[]>(
      `${this.apiUrl}/monthly`,
      {
        params: {
          months: months.toString()
        }
      }
    );
  }

}