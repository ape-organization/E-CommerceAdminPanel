import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

import { BrandService } from '../../../../services/brand.service';
import { Brand } from '../../../../models/Brand.model';

import { SharedModule } from '../../../../shared/shared.module';

import { AddBrand } from '../add-brand/add-brand';
import { ConfirmDeleteComponent } from '../../../../shared/confirm-delete/confirm-delete.component';

import { environment } from '../../../../../environments/environment';
import { translate, TranslatePipe } from '@ngx-translate/core';


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

  private readonly brandService = inject(BrandService);
  private readonly dialog = inject(MatDialog);


  // ============================================================
  // DATA
  // ============================================================

  brands = signal<Brand[]>([]);

  dataSource = signal(
    new MatTableDataSource<Brand>()
  );


  // ============================================================
  // PAGINATION
  // ============================================================

  pageIndex = signal(0);
  pageSize = signal(10);


  // ============================================================
  // TABLE
  // ============================================================

  displayedColumns = [
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
  // LOAD
  // ============================================================

  loadBrands(): void {

    this.brandService.getBrands().subscribe({

      next: (brands) => {

        this.brands.set(
          Array.isArray(brands) ? brands : []
        );

        this.updateTable();

      },

      error: (error) => {

        console.error(
          'Error loading brands:',
          error
        );

        this.brands.set([]);
        this.updateTable();

      }

    });

  }


  // ============================================================
  // PAGINATION
  // ============================================================

  onPageChange(event: PageEvent): void {

    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    this.updateTable();

  }


  private updateTable(): void {

    const start =
      this.pageIndex() * this.pageSize();

    const end =
      start + this.pageSize();

    const data =
      this.brands().slice(start, end);

    this.dataSource.set(
      new MatTableDataSource<Brand>(data)
    );

  }


  // ============================================================
  // ADD
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
      .subscribe(res => {

        if (res?.status) {
          this.loadBrands();
        }

      });

  }


  // ============================================================
  // EDIT
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
      .subscribe(res => {

        if (res?.status) {
          this.loadBrands();
        }

      });

  }


  // ============================================================
  // DELETE
  // ============================================================

  deleteBrand(id: number): void {

    this.dialog
      .open(
        ConfirmDeleteComponent,
        {
          data:
            'Are you sure you want to delete this brand?'
        }
      )
      .afterClosed()
      .subscribe(res => {

        if (!res?.status) {
          return;
        }

        this.brandService
          .deleteBrand(id)
          .subscribe({

            next: () => {

              const updated =
                this.brands()
                  .filter(brand => brand.id !== id);

              this.brands.set(updated);

              /*
               * If the last item on the current
               * page was deleted, go back one page.
               */

              const maxPage =
                Math.max(
                  0,
                  Math.ceil(
                    updated.length / this.pageSize()
                  ) - 1
                );

              if (this.pageIndex() > maxPage) {
                this.pageIndex.set(maxPage);
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
  // IMAGE
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