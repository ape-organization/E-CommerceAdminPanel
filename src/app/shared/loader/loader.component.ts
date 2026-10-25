import {
  Component,
  effect,
  inject,
  signal
} from '@angular/core';

import {
  TranslatePipe
} from '@ngx-translate/core';

import {
  LoadingService
} from '../../services/loading.service';


// Requests faster than this never show the loader (avoids a flash).
const SHOW_DELAY_MS = 200;


@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent {

  private readonly loadingService =
    inject(LoadingService);


  readonly visible =
    signal(false);


  readonly dots =
    [0, 1, 2, 3, 4];


  private showTimer?: ReturnType<typeof setTimeout>;


  constructor() {

    effect(() => {

      const loading =
        this.loadingService.isLoading();


      clearTimeout(this.showTimer);


      if (loading) {

        this.showTimer =
          setTimeout(
            () => this.visible.set(true),
            SHOW_DELAY_MS
          );

      } else {

        this.visible.set(false);

      }

    });

  }

}
