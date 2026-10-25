import {
  Injectable,
  computed,
  signal
} from '@angular/core';


// ============================================================
// LOADING SERVICE
// ------------------------------------------------------------
// Counts in-flight HTTP requests (see loading.interceptor.ts).
// The global <app-loader> is visible while the count > 0.
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  private readonly pending =
    signal(0);


  readonly isLoading =
    computed(
      () => this.pending() > 0
    );


  start(): void {

    this.pending.update(
      count => count + 1
    );

  }


  stop(): void {

    this.pending.update(
      count => Math.max(0, count - 1)
    );

  }

}
