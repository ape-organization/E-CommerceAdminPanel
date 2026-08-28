import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';

import { MatIconModule } from '@angular/material/icon';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTableModule } from '@angular/material/table';

import { MatTooltipModule } from '@angular/material/tooltip';

import { ProductService } from '../../../../services/product.service';

import { AddProductComponent } from '../add-product/add-product.component';

import { environment } from '../../../../../environments/environment';
import { ConfirmDeleteComponent } from '../../../../shared/confirm-delete/confirm-delete.component';
import { Product } from '../../../../models/product.model';


// ============================================================
// COMPONENT
// ============================================================

@Component({
  selector: 'app-product-management',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule
  ],

  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.scss'
})
export class ProductManagementComponent implements OnInit {

  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);


  // ==========================================================
  // DATA
  // ==========================================================

  readonly products = signal<Product[]>([]);

  readonly searchTerm = signal('');

  readonly isLoading = signal(false);

  readonly errorMessage = signal<string | null>(null);


  // ==========================================================
  // PAGINATION
  // ==========================================================

  readonly pageIndex = signal(0);

  readonly pageSize = signal(10);


  // ==========================================================
  // FILTERED PRODUCTS
  // ==========================================================

  readonly filteredProducts = computed(() => {

    const term = this.searchTerm()
      .trim()
      .toLowerCase();

    if (!term) {
      return this.products();
    }

    return this.products().filter(product => {

      const name = product.name
        ?.toLowerCase()
        .includes(term);

      const description = product.description
        ?.toLowerCase()
        .includes(term);

      const brand = product.brand?.name
        ?.toLowerCase()
        .includes(term);

      const subCategory = product.subCategories?.some(
        sc => sc.name?.toLowerCase().includes(term)
      );

      const category = product.subCategories?.some(
        sc => sc.categoryName?.toLowerCase().includes(term)
      );

      return !!(
        name ||
        description ||
        brand ||
        subCategory ||
        category
      );
    });
  });


  // ==========================================================
  // PAGINATED PRODUCTS
  // ==========================================================

  readonly paginatedProducts = computed(() => {

    const products = this.filteredProducts();

    const start =
      this.pageIndex() * this.pageSize();

    return products.slice(
      start,
      start + this.pageSize()
    );
  });


  // ==========================================================
  // TABLE COLUMNS
  // ==========================================================

  readonly displayedColumns = [
    'image',
    'brand',
    'price',
    'discount',
    'stock',
    'subCategories',
    'actions'
  ];


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {
    this.loadProducts();
  }


  // ==========================================================
  // LOAD
  // ==========================================================

  loadProducts(): void {

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.productService.getProducts().subscribe({

      next: products => {

        this.products.set(
          Array.isArray(products)
            ? products
            : []
        );

        this.pageIndex.set(0);
        this.isLoading.set(false);

      },

      error: error => {

        console.error(
          'Error loading products:',
          error
        );

        this.products.set([]);

        this.errorMessage.set(
          error?.error?.message ||
          error?.message ||
          'Failed to load products.'
        );

        this.isLoading.set(false);

      }

    });
  }


  // ==========================================================
  // SEARCH
  // ==========================================================

  onSearch(value: string): void {

    this.searchTerm.set(value);

    this.pageIndex.set(0);
  }


  clearSearch(): void {

    this.searchTerm.set('');

    this.pageIndex.set(0);
  }


  // ==========================================================
  // PAGINATION
  // ==========================================================

  onPageChange(event: PageEvent): void {

    this.pageIndex.set(event.pageIndex);

    this.pageSize.set(event.pageSize);
  }


  // ==========================================================
  // PRICE
  // ==========================================================

  getDiscountedPrice(product: Product): number {

    const price = Number(product.price) || 0;

    const discount =
      Number(product.discountPercentage) || 0;

    return price - (price * discount / 100);
  }


  // ==========================================================
  // ADD
  // ==========================================================

  addProduct(): void {

    this.openProductDialog(false);
  }


  // ==========================================================
  // EDIT
  // ==========================================================

  editProduct(product: Product): void {

    this.openProductDialog(true, product);
  }


  private openProductDialog(
    isEditing: boolean,
    product?: Product
  ): void {

    this.dialog.open(
      AddProductComponent,
      {
        width: '900px',
        maxWidth: '95vw',
        maxHeight: '95vh',

        data: {
          isEditing,
          product
        }
      }
    )
    .afterClosed()
    .subscribe(result => {

      if (result) {
        this.loadProducts();
      }

    });
  }


  // ==========================================================
  // DELETE
  // ==========================================================

  deleteProduct(id: number): void {
  this.dialog
      .open(ConfirmDeleteComponent, {
        data: 'Are you sure you want to delete this product?'
      })
      .afterClosed()
      .subscribe(result => {
   
        if (!result?.status) {
          return;
        }


    this.productService
      .deleteProduct(id)
      .subscribe({

        next: () => {

          this.products.update(
            products =>
              products.filter(
                product => product.id !== id
              )
          );

          this.pageIndex.set(
            Math.min(
              this.pageIndex(),
              Math.max(
                0,
                Math.ceil(
                  this.filteredProducts().length /
                  this.pageSize()
                ) - 1
              )
            )
          );

        },

        error: error => {

          console.error(
            'Error deleting product:',
            error
          );

          this.errorMessage.set(
            error?.error?.message ??
            'Failed to delete product.'
          );

        }

      });
      })
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