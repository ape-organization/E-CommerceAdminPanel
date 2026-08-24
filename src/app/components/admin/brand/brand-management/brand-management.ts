import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

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
  MatTableDataSource
} from '@angular/material/table';

import {
  ConfirmDeleteComponent
} from '../../../../shared/confirm-delete/confirm-delete.component';

import {
  MatDialog
} from '@angular/material/dialog';
import { environment } from '../../../../../environments/environment';


@Component({
  selector: 'app-brand-management',

  standalone: true,

  imports: [
    SharedModule
  ],

  templateUrl:
    './brand-management.html',

  styleUrl:
    './brand-management.scss'
})
export class BrandManagement
  implements OnInit {


  // =====================================================
  // SERVICES
  // =====================================================

  private brandService =
    inject(BrandService);


  // =====================================================
  // DATA
  // =====================================================

  brands =
    signal<Brand[]>([]);


  dataSource =
    new MatTableDataSource<Brand>();


  displayedColumns: string[] = [
    'name',
    'actions'
  ];


  // =====================================================
  // STATE
  // =====================================================

  brandToEdit:
    Brand | null = null;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private dialog: MatDialog
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadBrands();

  }


  // =====================================================
  // LOAD BRANDS
  // =====================================================

  loadBrands(): void {

    this.brandService
      .getBrands()
      .subscribe({

        next: (brands: Brand[]) => {

          this.brands.set(brands);
console.log(brands)
          this.dataSource.data =
            brands;

        },

        error: (error) => {

          console.error(
            'Error loading brands:',
            error
          );

        }

      });

  }


  // =====================================================
  // ADD BRAND
  // =====================================================

  showAddBrand(): void {

    this.brandToEdit = null;


    this.dialog
      .open(
        AddBrand,
        {

          width: '500px',

          maxWidth: '95vw',

          disableClose: true,

          data: {

            brand: null,

            add: true

          }

        }
      )
      .afterClosed()
      .subscribe((res: any) => {

        if (
          !res ||
          !res.status
        ) {

          return;

        }


        this.loadBrands();

        this.closeBrandDialog();

      });

  }


  // =====================================================
  // EDIT BRAND
  // =====================================================

  editBrand(
    brand: Brand
  ): void {

    this.brandToEdit =
      brand;


    this.dialog
      .open(
        AddBrand,
        {

          width: '500px',

          maxWidth: '95vw',

          disableClose: true,

          data: {

            brand:
              this.brandToEdit,

            add: false

          }

        }
      )
      .afterClosed()
      .subscribe((res: any) => {

        if (
          !res ||
          !res.status
        ) {

          return;

        }


        this.loadBrands();

        this.closeBrandDialog();

      });

  }


  // =====================================================
  // DELETE BRAND
  // =====================================================

  deleteBrand(
    id: number
  ): void {

    this.dialog
      .open(
        ConfirmDeleteComponent,
        {

          data:
            'Are you sure you want to delete this brand?'

        }
      )
      .afterClosed()
      .subscribe((res: any) => {

        if (
          !res ||
          !res.status
        ) {

          return;

        }


        this.brandService
          .deleteBrand(id)
          .subscribe({

            next: () => {

              this.loadBrands();

            },

            error: (error) => {

              console.error(
                'Error deleting brand:',
                error
              );

            }

          });

      });

  }


  // =====================================================
  // CLOSE
  // =====================================================

  closeBrandDialog(): void {

    this.brandToEdit = null;

  }
 // ==========================================================
  // IMAGE URL
  // ==========================================================

  getImageUrl(
    imageUrl?: string | null
  ): string {

    if (!imageUrl) {

      return 'assets/images/product-placeholder.png';

    }


    if (

      imageUrl.startsWith(
        'http://'
      ) ||

      imageUrl.startsWith(
        'https://'
      )

    ) {

      return imageUrl;

    }

    return environment.imageBaseUrl+imageUrl;

  }
}