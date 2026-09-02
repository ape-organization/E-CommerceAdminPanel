import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';

import {
  MatDialog
} from '@angular/material/dialog';

import {
  MatTableDataSource
} from '@angular/material/table';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import {
  BrandService
} from '../../../../services/brand.service';

import {
  Brand
} from '../../../../models/Brand.model';

import {
  SharedModule
} from '../../../../shared/shared.module';

import {
  AddBrand
} from '../add-brand/add-brand';

import {
  ConfirmDeleteComponent
} from '../../../../shared/confirm-delete/confirm-delete.component';

import {
  environment
} from '../../../../../environments/environment';

import {
  LanguageService
} from '../../../../services/language.service';


@Component({
  selector: 'app-brand-management',

  standalone: true,

  imports: [
    SharedModule,
    MatPaginatorModule,
    TranslatePipe
  ],

  templateUrl: './brand-management.html',

  styleUrl: './brand-management.scss'
})
export class BrandManagement implements OnInit {

  // ============================================================
  // SERVICES
  // ============================================================

  private readonly brandService =
    inject(BrandService);

  private readonly dialog =
    inject(MatDialog);

  private readonly translate =
    inject(TranslateService);

  readonly languageService =
    inject(LanguageService);


  // ============================================================
  // DATA
  // ============================================================

  readonly brands =
    signal<Brand[]>([]);

  readonly dataSource =
    signal(
      new MatTableDataSource<Brand>()
    );


  // ============================================================
  // PAGINATION
  // ============================================================

  readonly pageIndex =
    signal(0);

  readonly pageSize =
    signal(10);


  // ============================================================
  // TABLE
  // ============================================================

  readonly displayedColumns = [
    'name',
    'actions'
  ];


  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {
    this.loadBrands();
  }


  // ============================================================
  // LOAD BRANDS
  // ============================================================

  loadBrands(): void {

    this.brandService
      .getBrands()
      .subscribe({

        next: brands => {
console.log(brands)
          const result =
            Array.isArray(brands)
              ? brands
              : [];

          this.brands.set(result);

          /*
           * Make sure the current page
           * still exists after loading.
           */
          const maxPage =
            Math.max(
              0,
              Math.ceil(
                result.length /
                this.pageSize()
              ) - 1
            );

          if (this.pageIndex() > maxPage) {
            this.pageIndex.set(maxPage);
          }

          this.updateTable();
        },

        error: error => {

          console.error(
            'Error loading brands:',
            error
          );

          this.brands.set([]);

          this.pageIndex.set(0);

          this.updateTable();
        }

      });

  }


  // ============================================================
  // BRAND NAME
  // ============================================================

  getBrandName(brand: Brand): string {

    return this.languageService.currentLanguage() === 'ar'
      ? brand.nameAr
      : brand.nameEn;

  }


  // ============================================================
  // PAGINATION
  // ============================================================

  onPageChange(event: PageEvent): void {

    this.pageIndex.set(
      event.pageIndex
    );

    this.pageSize.set(
      event.pageSize
    );

    this.updateTable();

  }


  private updateTable(): void {

    const start =
      this.pageIndex() *
      this.pageSize();

    const end =
      start +
      this.pageSize();

    const data =
      this.brands().slice(
        start,
        end
      );

    this.dataSource.set(
      new MatTableDataSource<Brand>(data)
    );

  }


  // ============================================================
  // ADD BRAND
  // ============================================================

  showAddBrand(): void {

    this.dialog
      .open(AddBrand, {

        width: '500px',

        maxWidth: '95vw',

        disableClose: true,

        data: {
          brand: null,
          add: true
        }

      })
      .afterClosed()
      .subscribe(result => {

        if (result?.status) {
          this.loadBrands();
        }

      });

  }


  // ============================================================
  // EDIT BRAND
  // ============================================================

  editBrand(brand: Brand): void {

    this.dialog
      .open(AddBrand, {

        width: '500px',

        maxWidth: '95vw',

        disableClose: true,

        data: {
          brand,
          add: false
        }

      })
      .afterClosed()
      .subscribe(result => {

        if (result?.status) {
          this.loadBrands();
        }

      });

  }


  // ============================================================
  // DELETE BRAND
  // ============================================================

  deleteBrand(id: number): void {

    this.dialog
      .open(
        ConfirmDeleteComponent,
        {
          data: this.translate.instant(
            'brands.deleteConfirmation'
          )
        }
      )
      .afterClosed()
      .subscribe(result => {

        if (!result?.status) {
          return;
        }

        this.brandService
          .deleteBrand(id)
          .subscribe({

            next: () => {

              const updated =
                this.brands().filter(
                  brand => brand.id !== id
                );

              this.brands.set(updated);

              /*
               * If the last item on the current
               * page was deleted, move to the
               * previous page.
               */
              const maxPage =
                Math.max(
                  0,
                  Math.ceil(
                    updated.length /
                    this.pageSize()
                  ) - 1
                );

              if (
                this.pageIndex() >
                maxPage
              ) {

                this.pageIndex.set(
                  maxPage
                );

              }

              this.updateTable();

            },

            error: error => {

              console.error(
                'Error deleting brand:',
                error
              );

            }

          });

      });

  }


  // ============================================================
  // IMAGE URL
  // ============================================================

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