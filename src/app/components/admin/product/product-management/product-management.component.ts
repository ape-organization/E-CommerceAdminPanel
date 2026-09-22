
import {
  CommonModule
} from '@angular/common';

import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  MatButtonModule
} from '@angular/material/button';

import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';

import {
  MatProgressSpinnerModule
} from '@angular/material/progress-spinner';

import {
  MatTableModule
} from '@angular/material/table';

import {
  MatTooltipModule
} from '@angular/material/tooltip';

import {
  ProductService
} from '../../../../services/product.service';

import {
  AddProductComponent
} from '../add-product/add-product.component';

import {
  environment
} from '../../../../../environments/environment';

import {
  ConfirmDeleteComponent
} from '../../../../shared/confirm-delete/confirm-delete.component';

import {
  Product
} from '../../../../models/product.model';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';


@Component({
  selector: 'app-product-management',
  standalone: true,

  imports: [
    TranslatePipe,
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

  // ==========================================================
  // SERVICES
  // ==========================================================

  private readonly productService =
    inject(ProductService);

  private readonly dialog =
    inject(MatDialog);

  private readonly translate =
    inject(TranslateService);


  // ==========================================================
  // DATA
  // ==========================================================

  /**
   * Contains ALL products returned by the API.
   *
   * There is no server-side pagination anymore.
   */
  readonly hasLocalFilters =
  computed(() =>
    !!this.selectedCategory() ||
    !!this.selectedSubCategory() ||
    !!this.selectedBrand()
  );
  readonly products =
    signal<Product[]>([]);


  readonly searchTerm =
    signal('');


  readonly isLoading =
    signal(false);


  readonly errorMessage =
    signal<string | null>(null);


  // ==========================================================
  // LOCAL FILTERS
  // ==========================================================

  readonly selectedCategory =
    signal('');


  readonly selectedSubCategory =
    signal('');


  readonly selectedBrand =
    signal('');


  // ==========================================================
  // ALL PRODUCTS
  // ==========================================================

  /**
   * Alias used by the dropdown computed signals.
   *
   * Since the API returns all products, the products signal
   * itself is our complete local collection.
   */
  readonly allCachedProducts =
    computed(() => this.products());


  // ==========================================================
  // CATEGORY OPTIONS
  // ==========================================================

  readonly categoryOptions =
    computed(() => {

      const categories =
        new Set<string>();


      for (
        const product of this.allCachedProducts()
      ) {

        for (
          const subCategory of
          product.subCategories ?? []
        ) {

          const categoryName =
            subCategory.categoryName
              ?.trim();

          if (categoryName) {

            categories.add(
              categoryName
            );

          }

        }

      }


      return Array.from(categories)
        .sort((a, b) =>
          a.localeCompare(b)
        );

    });


  // ==========================================================
  // SUBCATEGORY OPTIONS
  // ==========================================================

  readonly subCategoryOptions =
    computed(() => {

      const selectedCategory =
        this.selectedCategory()
          .trim()
          .toLowerCase();


      const subCategories =
        new Set<string>();


      for (
        const product of this.allCachedProducts()
      ) {

        for (
          const subCategory of
          product.subCategories ?? []
        ) {

          const subCategoryName =
            subCategory.nameEn
              ?.trim();


          const categoryName =
            subCategory.categoryName
              ?.trim()
              .toLowerCase();


          if (!subCategoryName) {
            continue;
          }


          // No category selected
          if (!selectedCategory) {

            subCategories.add(
              subCategoryName
            );

            continue;
          }


          // Category selected
          if (
            categoryName ===
            selectedCategory
          ) {

            subCategories.add(
              subCategoryName
            );

          }

        }

      }


      return Array.from(subCategories)
        .sort((a, b) =>
          a.localeCompare(b)
        );

    });


  // ==========================================================
  // BRAND OPTIONS
  // ==========================================================

  readonly brandOptions =
    computed(() => {

      const brands =
        new Set<string>();


      for (
        const product of this.allCachedProducts()
      ) {

        const brandName =
          product.brand?.nameEn
            ?.trim();


        if (brandName) {

          brands.add(
            brandName
          );

        }

      }


      return Array.from(brands)
        .sort((a, b) =>
          a.localeCompare(b)
        );

    });


  // ==========================================================
  // LOCAL TABLE PAGINATION
  // ==========================================================

  /**
   * These belong only to the Angular Material paginator.
   *
   * They do NOT represent API pages.
   */
  readonly pageIndex =
    signal(0);


  readonly pageSize =
    signal(10);


  // ==========================================================
  // FILTERED PRODUCTS
  // ==========================================================

  /**
   * Applies:
   *
   * - Search
   * - Category
   * - Subcategory
   * - Brand
   *
   * completely in memory.
   */
  readonly filteredProducts =
    computed(() => {

      const term =
        this.searchTerm()
          .trim()
          .toLowerCase();


      const category =
        this.selectedCategory()
          .trim()
          .toLowerCase();


      const subCategory =
        this.selectedSubCategory()
          .trim()
          .toLowerCase();


      const brand =
        this.selectedBrand()
          .trim()
          .toLowerCase();


      const currentProducts =
        this.products();


      return currentProducts.filter(
        product => {

          // ====================================================
          // SEARCH
          // ====================================================

          let matchesSearch = true;


          if (term) {

            const nameEn =
              product.nameEn
                ?.toLowerCase()
                .includes(term);


            const nameAr =
              product.nameAr
                ?.toLowerCase()
                .includes(term);


            const descriptionEn =
              product.descriptionEn
                ?.toLowerCase()
                .includes(term);


            const descriptionAr =
              product.descriptionAr
                ?.toLowerCase()
                .includes(term);


            const brandName =
              product.brand?.nameEn
                ?.toLowerCase()
                .includes(term);


            const subCategoryName =
              product.subCategories?.some(
                sub =>
                  sub.nameEn
                    ?.toLowerCase()
                    .includes(term) ||

                  sub.nameAr
                    ?.toLowerCase()
                    .includes(term)
              );


            const categoryName =
              product.subCategories?.some(
                sub =>
                  sub.categoryName
                    ?.toLowerCase()
                    .includes(term)
              );


            matchesSearch = !!(
              nameEn ||
              nameAr ||
              descriptionEn ||
              descriptionAr ||
              brandName ||
              subCategoryName ||
              categoryName
            );

          }


          // ====================================================
          // CATEGORY
          // ====================================================

          let matchesCategory = true;


          if (category) {

            matchesCategory =
              !!product.subCategories?.some(
                sub =>
                  sub.categoryName
                    ?.trim()
                    .toLowerCase() ===
                  category
              );

          }


          // ====================================================
          // SUBCATEGORY
          // ====================================================

          let matchesSubCategory = true;


          if (subCategory) {

            matchesSubCategory =
              !!product.subCategories?.some(
                sub =>
                  (
                    sub.nameEn ||
                    sub.nameAr
                  )
                    ?.trim()
                    .toLowerCase() ===
                  subCategory
              );

          }


          // ====================================================
          // BRAND
          // ====================================================

          let matchesBrand = true;


          if (brand) {

            matchesBrand =
              product.brand?.nameEn
                ?.trim()
                .toLowerCase() ===
              brand;

          }


          // ====================================================
          // FINAL RESULT
          // ====================================================

          return (
            matchesSearch &&
            matchesCategory &&
            matchesSubCategory &&
            matchesBrand
          );

        }
      );

    });


  // ==========================================================
  // LOCAL PAGINATED PRODUCTS
  // ==========================================================

  /**
   * This is the list actually displayed in the table.
   *
   * Pagination happens completely locally.
   */
  readonly paginatedProducts =
    computed(() => {

      const filtered =
        this.filteredProducts();


      const start =
        this.pageIndex() *
        this.pageSize();


      return filtered.slice(
        start,
        start + this.pageSize()
      );

    });


  // ==========================================================
  // TABLE COLUMNS
  // ==========================================================

  readonly displayedColumns = [
    'image',
    'nameEn',
    'nameAr',
    'brand',
    'price',
    'sellingPrice',
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
  // LOAD ALL PRODUCTS
  // ==========================================================

  /**
   * Loads the complete product list once.
   *
   * There is no API pagination.
   */
  private loadProducts(): void {

    if (this.isLoading()) {
      return;
    }


    this.isLoading.set(true);

    this.errorMessage.set(null);


    this.productService
      .getAdminProducts()
      .subscribe({

        next: (
          response: Product[]
        ) => {

          const items =
            Array.isArray(response)
              ? response
              : [];


          console.log(
            'Loaded products:',
            items.length
          );


          this.products.set(
            items
          );


          // Reset table pagination
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
            'Failed to load products.'
          );


          this.isLoading.set(false);

        }

      });

  }


  // ==========================================================
  // LOCAL TABLE PAGINATOR
  // ==========================================================

  onPageChange(
    event: PageEvent
  ): void {

    this.pageIndex.set(
      event.pageIndex
    );


    this.pageSize.set(
      event.pageSize
    );

  }


  // ==========================================================
  // SEARCH
  // ==========================================================

  /**
   * Search is completely local.
   *
   * No API request is made.
   */
  onSearch(
    value: string
  ): void {

    this.searchTerm.set(
      value.trim()
    );


    // Always return to page 1
    this.pageIndex.set(0);

  }


  // ==========================================================
  // CATEGORY FILTER
  // ==========================================================

  onCategoryFilterChange(
    value: string
  ): void {

    const category =
      value?.trim() ?? '';


    this.selectedCategory.set(
      category
    );


    // A category change resets
    // the selected subcategory.
    this.selectedSubCategory.set('');


    // Return to first page.
    this.pageIndex.set(0);

  }


  // ==========================================================
  // SUBCATEGORY FILTER
  // ==========================================================

  onSubCategoryFilterChange(
    value: string
  ): void {

    this.selectedSubCategory.set(
      value?.trim() ?? ''
    );


    // Return to first page.
    this.pageIndex.set(0);

  }


  // ==========================================================
  // BRAND FILTER
  // ==========================================================

  onBrandFilterChange(
    value: string
  ): void {

    this.selectedBrand.set(
      value?.trim() ?? ''
    );


    // Return to first page.
    this.pageIndex.set(0);

  }


  // ==========================================================
  // CLEAR ALL FILTERS
  // ==========================================================

  clearFilters(): void {

    this.selectedCategory.set('');

    this.selectedSubCategory.set('');

    this.selectedBrand.set('');


    // Return to first page.
    this.pageIndex.set(0);

  }


  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  clearSearch(): void {

    this.searchTerm.set('');


    // Return to first page.
    this.pageIndex.set(0);

  }


  // ==========================================================
  // PRICE
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
      (
        price *
        discount /
        100
      )
    );

  }


  // ==========================================================
  // ADD PRODUCT
  // ==========================================================

  addProduct(): void {

    this.openProductDialog(
      false
    );

  }


  // ==========================================================
  // EDIT PRODUCT
  // ==========================================================

  editProduct(
    product: Product
  ): void {

    this.openProductDialog(
      true,
      product
    );

  }


  // ==========================================================
  // PRODUCT DIALOG
  // ==========================================================

  private openProductDialog(
    isEditing: boolean,
    product?: Product
  ): void {

    this.dialog
      .open(
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

          this.refreshProducts();

        }

      });

  }


  // ==========================================================
  // REFRESH PRODUCTS
  // ==========================================================

  /**
   * Reloads the complete product list after
   * adding, editing or deleting a product.
   */
  private refreshProducts(): void {

    // Reset table pagination
    this.pageIndex.set(0);


    // Reset search
    this.searchTerm.set('');


    // Reset filters
    this.selectedCategory.set('');

    this.selectedSubCategory.set('');

    this.selectedBrand.set('');


    // Clear current data before reload
    this.products.set([]);


    // Reload everything
    this.loadProducts();

  }


  // ==========================================================
  // DELETE PRODUCT
  // ==========================================================

  deleteProduct(
    id: number
  ): void {

    this.dialog
      .open(
        ConfirmDeleteComponent,
        {
          data:
            this.translate.instant(
              'products.deleteConfirmation'
            )
        }
      )
      .afterClosed()
      .subscribe(result => {

        if (!result?.status) {
          return;
        }


        this.productService
          .deleteProduct(id)
          .subscribe({

            next: () => {

              this.refreshProducts();

            },


            error: error => {

              console.error(
                'Error deleting product:',
                error
              );


              this.errorMessage.set(
                'Failed to delete product.'
              );

            }

          });

      });

  }


  // ==========================================================
  // IMAGE
  // ==========================================================

  getImageUrl(
    imageUrl?: string | null
  ): string {

    if (!imageUrl) {

      return (
        'assets/images/product-placeholder.png'
      );

    }


    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://')
    ) {

      return imageUrl;

    }


    return (
      `${environment.imageBaseUrl}${imageUrl}`
    );

  }

}
