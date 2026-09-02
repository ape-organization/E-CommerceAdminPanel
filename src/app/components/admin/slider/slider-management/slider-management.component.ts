import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MatDialog } from '@angular/material/dialog';


import { Category } from '../../../../models/category.model';

import { SharedModule } from '../../../../shared/shared.module';


import { ConfirmDeleteComponent } from '../../../../shared/confirm-delete/confirm-delete.component';

import { environment } from '../../../../../environments/environment';
import { TranslatePipe } from '@ngx-translate/core';
import { SliderService } from '../../../../services/slider.service';
import { AddSliderComponent } from '../add-slider/add-slider.component';


@Component({
  selector: 'app-slider-management',
  standalone: true,

  imports: [
    SharedModule,
    MatPaginatorModule,
    TranslatePipe
  ],

  templateUrl: './slider-management.component.html',

  styleUrl: './slider-management.component.scss'
})
export class SliderManagementComponent implements OnInit {

  private readonly sliderService =
    inject(SliderService);

  private readonly dialog =
    inject(MatDialog);


  // ==========================================================
  // DATA
  // ==========================================================

  readonly sliders =
    signal<any>([]);


  // ==========================================================
  // PAGINATION
  // ==========================================================

  readonly pageIndex =
    signal(0);

  readonly pageSize =
    signal(10);


  readonly paginatedCategories = computed(() => {

    const sliders = this.sliders();

    const start =
      this.pageIndex() * this.pageSize();

    return sliders.slice(
      start,
      start + this.pageSize()
    );

  });


  // ==========================================================
  // TABLE
  // ==========================================================

  readonly displayedColumns = [
    'name',
   
    'actions'
  ];


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {
    this.loadSliders();
  }


  // ==========================================================
  // LOAD
  // ==========================================================

  loadSliders(): void {

    this.sliderService
      .getSliders()
      .subscribe({

        next: sliders => {
console.log(sliders)
          this.sliders.set(
            Array.isArray(sliders)
              ? sliders
              : []
          );

          this.pageIndex.set(0);

        },

        error: error => {

          console.error(
            'Error loading sliders:',
            error
          );

        }

      });
  }


  // ==========================================================
  // PAGINATION
  // ==========================================================

  onPageChange(event: PageEvent): void {

    this.pageIndex.set(
      event.pageIndex
    );

    this.pageSize.set(
      event.pageSize
    );
  }


  // ==========================================================
  // ADD
  // ==========================================================

  showAddSlider(): void {

    this.openSliderDialog(
      true
    );
  }


  // ==========================================================
  // EDIT
  // ==========================================================

  editSlider(
    slider: any
  ): void {

    this.openSliderDialog(
      false,
      slider
    );
  }


  private openSliderDialog(
    add: boolean,
    slider: any | null = null
  ): void {

    this.dialog
      .open(
        AddSliderComponent,
        {

          width: '500px',

          maxWidth: '95vw',

          disableClose: true,

          data: {
            slider,
            add,
            categories: this.sliders()
          }

        }
      )
      .afterClosed()
      .subscribe(result => {

        if (result?.status) {
          this.loadSliders();
        }

      });
  }





  // ==========================================================
  // KEEP PAGINATION VALID AFTER DELETE
  // ==========================================================

  private fixPageAfterDelete(): void {

    const lastPage = Math.max(
      0,
      Math.ceil(
        this.sliders().length /
        this.pageSize()
      ) - 1
    );

    this.pageIndex.set(
      Math.min(
        this.pageIndex(),
        lastPage
      )
    );
  }


  // ==========================================================
  // IMAGE
  // ==========================================================

  getImageUrl(
    imageUrl?: string | null
  ): string {

    if (!imageUrl) {
      return 'assets/images/product-placeholder.png';
    }

    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://')
    ) {
      return imageUrl;
    }

    return `${environment.imageBaseUrl}${imageUrl}`;
  }

}