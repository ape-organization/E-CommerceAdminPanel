import { CommonModule } from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';

import { MatIconModule } from '@angular/material/icon';

import { MatInputModule } from '@angular/material/input';

import {
  MatProgressSpinnerModule
} from '@angular/material/progress-spinner';

import { MatTableModule } from '@angular/material/table';

import {
  MatTooltipModule
} from '@angular/material/tooltip';

import { ProductService } from '../../../../services/product.service';

import {
  AddProductComponent
} from '../add-product/add-product.component';
import { environment } from '../../../../../environments/environment';


// ============================================================
// MODELS
// ============================================================

export interface Brand {

  id: number;

  name: string;

  imageUrl?: string | null;

  isDeleted?: boolean;

}


export interface SubCategory {

  id: number;

  name: string;

  categoryId: number;

  categoryName?: string;

}


export interface Product {

  id: number;

  name: string;

  description?: string | null;

  price: number;
  isInStock: boolean;

  discountPercentage?: number | null;

  stockQuantity: number;

  imageUrl?: string | null;

  brandId?: number | null;

  brand?: Brand | null;

  subCategories: SubCategory[];

}


// ============================================================
// COMPONENT
// ============================================================

@Component({

  selector:
    'app-product-management',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    MatButtonModule,

    MatDialogModule,

    MatIconModule,

    MatInputModule,

    MatProgressSpinnerModule,

    MatTableModule,

    MatTooltipModule

  ],

  templateUrl:
    './product-management.component.html',

  styleUrl:
    './product-management.component.scss'

})
export class ProductManagementComponent
  implements OnInit {


  // ==========================================================
  // SERVICES
  // ==========================================================

  private readonly productService =
    inject(ProductService);

  private readonly dialog =
    inject(MatDialog);

  private readonly cdr =
    inject(ChangeDetectorRef);


  // ==========================================================
  // DATA
  // ==========================================================

  products: Product[] = [];

  filteredProducts: Product[] = [];


  // ==========================================================
  // TABLE COLUMNS
  // ==========================================================

  displayedColumns: string[] = [

    'image',

    'brand',

    'price',

    'discount',

    'stock',

    'subCategories',

    'actions'

  ];


  // ==========================================================
  // UI STATE
  // ==========================================================

  searchTerm = '';

  isLoading = false;

  errorMessage: string | null = null;


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.loadProducts();

  }


  // ==========================================================
  // LOAD PRODUCTS
  // ==========================================================

  loadProducts(): void {

    this.isLoading = true;

    this.errorMessage = null;


    this.productService
      .getProducts()
      .subscribe({

        next: (products) => {

          this.products =
            Array.isArray(products)
              ? products
              : [];
console.log(this.products)
          this.filteredProducts =
            [...this.products];


          this.isLoading =
            false;


          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Error loading products:',
            error
          );


          this.products = [];

          this.filteredProducts = [];


          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Failed to load products.';


          this.isLoading =
            false;


          this.cdr.detectChanges();

        }

      });

  }


  // ==========================================================
  // SEARCH
  // ==========================================================

  applyFilter(): void {

    const term =
      this.searchTerm
        .trim()
        .toLowerCase();


    if (!term) {

      this.filteredProducts =
        [...this.products];

      return;

    }


    this.filteredProducts =
      this.products.filter(
        product => {

          const name =
            product.name
              ?.toLowerCase()
              .includes(term);


          const description =
            product.description
              ?.toLowerCase()
              .includes(term);


          const brand =
            product.brand?.name
              ?.toLowerCase()
              .includes(term);


          const subCategory =
            product.subCategories
              ?.some(sc =>
                sc.name
                  ?.toLowerCase()
                  .includes(term)
              );


          const category =
            product.subCategories
              ?.some(sc =>
                sc.categoryName
                  ?.toLowerCase()
                  .includes(term)
              );


          return !!(

            name ||

            description ||

            brand ||

            subCategory ||

            category

          );

        }
      );

  }


  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  clearSearch(): void {

    this.searchTerm = '';

    this.applyFilter();

  }


  // ==========================================================
  // DISCOUNTED PRICE
  // ==========================================================

  getDiscountedPrice(
    product: Product
  ): number {

    const price =
      Number(product.price) || 0;


    const discount =
      Number(
        product.discountPercentage
      ) || 0;


    return (
      price -
      (price * discount / 100)
    );

  }


  // ==========================================================
  // ADD PRODUCT
  // ==========================================================

  addProduct(): void {

    const dialogRef =
      this.dialog.open(
        AddProductComponent,
        {

          width: '900px',

          maxWidth: '95vw',

          maxHeight: '95vh',

          data: {

            isEditing: false

          }

        }
      );


    dialogRef
      .afterClosed()
      .subscribe(
        result => {

          if (result) {

            this.loadProducts();

          }

        }
      );

  }


  // ==========================================================
  // EDIT PRODUCT
  // ==========================================================

  editProduct(
    product: Product
  ): void {

    const dialogRef =
      this.dialog.open(
        AddProductComponent,
        {

          width: '900px',

          maxWidth: '95vw',

          maxHeight: '95vh',

          data: {

            isEditing: true,

            product

          }

        }
      );


    dialogRef
      .afterClosed()
      .subscribe(
        result => {

          if (result) {

            this.loadProducts();

          }

        }
      );

  }


  // ==========================================================
  // DELETE PRODUCT
  // ==========================================================

  deleteProduct(
    id: number
  ): void {

    const confirmed =
      confirm(
        'Are you sure you want to delete this product?'
      );


    if (!confirmed) {

      return;

    }


    this.productService
      .deleteProduct(id)
      .subscribe({

        next: () => {

          this.products =
            this.products.filter(
              p => p.id !== id
            );


          this.applyFilter();

        },


        error: (error) => {

          console.error(
            'Error deleting product:',
            error
          );


          this.errorMessage =
            error?.error?.message ??
            'Failed to delete product.';

        }

      });

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


    return `${environment.imageBaseUrl}${imageUrl}`;

  }

}