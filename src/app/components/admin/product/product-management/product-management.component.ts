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
  ProductService,
  PagedResponse
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
import { TranslatePipe } from '@ngx-translate/core';


// ============================================================
// COMPONENT
// ============================================================

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


  // ==========================================================
  // BACKEND PAGE SIZE
  // ==========================================================

  /*
   * Must match the backend page size.
   *
   * Backend:
   *
   * const int pageSize = 100;
   */

  private readonly apiPageSize = 100;


  // ==========================================================
  // DATA
  // ==========================================================

  readonly products =
    signal<Product[]>([]);


  readonly searchTerm =
    signal('');


  readonly isLoading =
    signal(false);


  readonly errorMessage =
    signal<string | null>(null);


  // ==========================================================
  // SERVER PAGINATION
  // ==========================================================

  readonly totalCount =
    signal(0);


  readonly totalPages =
    signal(0);


  /*
   * IMPORTANT:
   *
   * This is the LAST hasMore value received from the API.
   *
   * false = we reached the final page
   * true  = there are still products/pages remaining
   */

  readonly hasMore =
    signal(false);


  // ==========================================================
  // ALL PRODUCTS LOADED
  // ==========================================================

  /*
   * This is based on the LAST API response.
   *
   * When the backend returns:
   *
   * hasMore: false
   *
   * we know we reached the last page and therefore
   * all products have been loaded into pageCache.
   */

  readonly allProductsLoaded =
    computed(() =>
      this.totalPages() > 0 &&
      this.hasMore() === false &&
      this.pageCache.size >= this.totalPages()
    );


  // ==========================================================
  // CURRENT API PAGE
  // ==========================================================

  readonly currentApiPage =
    signal(1);


  // ==========================================================
  // API PAGE CACHE
  // ==========================================================

  /*
   * Example:
   *
   * page 1 -> 100 products
   * page 2 -> 100 products
   * page 3 -> 100 products
   */

  private readonly pageCache =
    new Map<number, Product[]>();


  // ==========================================================
  // ANGULAR PAGINATION
  // ==========================================================

  readonly pageIndex =
    signal(0);


  readonly pageSize =
    signal(10);


  // ==========================================================
  // SEARCH MODE
  // ==========================================================

  readonly isSearchMode =
    computed(() =>
      this.searchTerm()
        .trim()
        .length > 0
    );


  // ==========================================================
  // FILTERED PRODUCTS
  // ==========================================================

  /*
   * When all products are loaded:
   *
   * Search is LOCAL.
   *
   * When all products are NOT loaded:
   *
   * searchProductsFromApi() puts only the DB results
   * into products.
   *
   * We do not locally filter API search results again.
   */

  readonly filteredProducts =
    computed(() => {

      const term =
        this.searchTerm()
          .trim()
          .toLowerCase();


      const currentProducts =
        this.products();


      // ------------------------------------------------------
      // NO SEARCH
      // ------------------------------------------------------

      if (!term) {

        return currentProducts;

      }


      // ------------------------------------------------------
      // LOCAL SEARCH
      // ------------------------------------------------------

      /*
       * Local search is ONLY valid when the complete
       * product list has been loaded.
       */

      if (
        this.allProductsLoaded()
      ) {

        return currentProducts.filter(
          product => {

            const nameEn =
              product.nameEn
                ?.toLowerCase()
                .includes(term);


            const descriptionEn =
              product.descriptionEn
                ?.toLowerCase()
                .includes(term);


            const brand =
              product.brand?.nameEn
                ?.toLowerCase()
                .includes(term);


            const subCategory =
              product.subCategories?.some(
                subCategory =>
                  subCategory.name
                    ?.toLowerCase()
                    .includes(term)
              );


            const category =
              product.subCategories?.some(
                subCategory =>
                  subCategory.categoryName
                    ?.toLowerCase()
                    .includes(term)
              );


            return !!(
              nameEn ||
              descriptionEn ||
              brand ||
              subCategory ||
              category
            );

          }
        );

      }


      // ------------------------------------------------------
      // API SEARCH
      // ------------------------------------------------------

      /*
       * When not all products are loaded,
       * products already contains the results returned
       * from the database.
       */

      return currentProducts;

    });


  // ==========================================================
  // PAGINATED PRODUCTS
  // ==========================================================

  readonly paginatedProducts =
    computed(() => {

      const products =
        this.filteredProducts();


      // ------------------------------------------------------
      // SEARCH MODE
      // ------------------------------------------------------
      //
      // Search results are paginated locally.
      //
      // This applies to both:
      //
      // 1. Local search
      // 2. DB search
      //
      // ------------------------------------------------------

      if (
        this.isSearchMode()
      ) {

        const start =
          this.pageIndex() *
          this.pageSize();


        return products.slice(
          start,
          start + this.pageSize()
        );

      }


      // ------------------------------------------------------
      // NORMAL MODE
      // ------------------------------------------------------

      /*
       * products contains the current API page.
       */

      const globalStart =
        this.pageIndex() *
        this.pageSize();


      const apiStart =
        (
          this.currentApiPage() - 1
        ) *
        this.apiPageSize;


      const localStart =
        Math.max(
          0,
          globalStart - apiStart
        );


      return products.slice(
        localStart,
        localStart + this.pageSize()
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
    'discount',
    'stock',
    'subCategories',
    'actions'
  ];


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.loadApiPage(1);

  }


  // ==========================================================
  // LOAD API PAGE
  // ==========================================================

  private loadApiPage(
    apiPage: number,
    afterLoad?: () => void
  ): void {

    // --------------------------------------------------------
    // INVALID PAGE
    // --------------------------------------------------------

    if (
      apiPage < 1
    ) {

      return;

    }


    // --------------------------------------------------------
    // DON'T GO BEYOND TOTAL PAGES
    // --------------------------------------------------------

    if (
      this.totalPages() > 0 &&
      apiPage > this.totalPages()
    ) {

      return;

    }


    // --------------------------------------------------------
    // CACHE
    // --------------------------------------------------------

    const cached =
      this.pageCache.get(
        apiPage
      );


    if (
      cached
    ) {

      this.products.set(
        cached
      );


      this.currentApiPage.set(
        apiPage
      );


      /*
       * IMPORTANT:
       *
       * If the cached page is the last page,
       * hasMore should already be false.
       */

      if (
        apiPage === this.totalPages()
      ) {

        this.hasMore.set(false);

      }


      this.isLoading.set(
        false
      );


      afterLoad?.();

      return;

    }


    // --------------------------------------------------------
    // LOADING
    // --------------------------------------------------------

    this.isLoading.set(
      true
    );


    this.errorMessage.set(
      null
    );


    // --------------------------------------------------------
    // API REQUEST
    // --------------------------------------------------------

    this.productService
      .getProducts(
        apiPage
      )
      .subscribe({

        next: (
          response:
            PagedResponse<Product>
        ) => {
console.log(response)
          const items =
            Array.isArray(
              response?.items
            )
              ? response.items
              : [];


          // --------------------------------------------------
          // CACHE PAGE
          // --------------------------------------------------

          this.pageCache.set(
            apiPage,
            items
          );


          // --------------------------------------------------
          // CURRENT PAGE
          // --------------------------------------------------

          this.products.set(
            items
          );


          this.currentApiPage.set(
            apiPage
          );


          // --------------------------------------------------
          // SERVER PAGINATION
          // --------------------------------------------------

          this.totalCount.set(
            Number(
              response?.totalCount
            ) || 0
          );


          this.totalPages.set(
            Number(
              response?.totalPages
            ) || 0
          );


          /*
           * THIS IS THE IMPORTANT VALUE.
           *
           * We always update it with the latest API response.
           */

          this.hasMore.set(
            !!response?.hasMore
          );

          if (
            response?.hasMore === false
          ) {
            this.setAllProducts();

          }


          // --------------------------------------------------
          // FINISHED
          // --------------------------------------------------

          this.isLoading.set(
            false
          );


          afterLoad?.();

        },


        error: error => {

          console.error(
            'Error loading products:',
            error
          );


          this.products.set(
            []
          );


          this.errorMessage.set(
            error?.error?.message ||
            error?.message ||
            'Failed to load products.'
          );


          this.isLoading.set(
            false
          );

        }

      });

  }


  // ==========================================================
  // SET ALL PRODUCTS
  // ==========================================================

  private setAllProducts(): void {

    const allProducts:
      Product[] = [];


    const pages =
      Array.from(
        this.pageCache.keys()
      )
      .sort(
        (a, b) => a - b
      );


    for (
      const page of pages
    ) {

      const items =
        this.pageCache.get(
          page
        ) ?? [];


      allProducts.push(
        ...items
      );

    }


    this.products.set(
      allProducts
    );


    this.currentApiPage.set(
      1
    );

  }


  // ==========================================================
  // SEARCH
  // ==========================================================

  onSearch(value: string ): void {
   const term =value.trim();

    this.searchTerm.set(value );
    this.pageIndex.set( 0);
    if (!term) {
      this.loadApiPage(
        1
      );

      return;

    }
    if (
      this.allProductsLoaded()
    ) {
      this.setAllProducts();


      return;

    }
    this.searchProductsFromApi(
      term
    );

  }


  // ==========================================================
  // SEARCH DATABASE
  // ==========================================================

  private searchProductsFromApi(
    name: string
  ): void {

    this.isLoading.set(
      true
    );


    this.errorMessage.set(
      null
    );


    this.productService
      .getProductsByName(
        name
      )
      .subscribe({

        next: products => {
console.log(products)
          const results =
            Array.isArray(
              products
            )
              ? products
              : [];
  this.products.set(
            results
          );
          this.currentApiPage.set(
            1
          );


          this.totalCount.set(
            results.length
          );


          this.totalPages.set(
            results.length > 0
              ? 1
              : 0
          );


          this.hasMore.set(
            false
          );


          // --------------------------------------------------
          // FINISHED
          // --------------------------------------------------

          this.isLoading.set(
            false
          );

        },


        error: error => {

          this.products.set(
            []
          );


          this.totalCount.set(
            0
          );


          this.totalPages.set(
            0
          );


          this.hasMore.set(
            false
          );


          this.errorMessage.set(
            error?.error?.message ||
            error?.message ||
            'Failed to search products.'
          );


          this.isLoading.set(
            false
          );

        }

      });

  }


  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  clearSearch(): void {

    this.searchTerm.set(
      ''
    );


    this.pageIndex.set(
      0
    );


    /*
     * Return to normal API pagination.
     */

    this.loadApiPage(
      1
    );

  }


  // ==========================================================
  // PAGINATION
  // ==========================================================

  onPageChange(
    event: PageEvent
  ): void {

    const newPageIndex =event.pageIndex;
    const newPageSize =event.pageSize;
this.pageSize.set( newPageSize );
    if (
      this.isSearchMode()
    ) {

      this.pageIndex.set(newPageIndex );
 return;

    }
    const globalStart =
      newPageIndex *
      newPageSize;


    const requiredApiPage =
      Math.floor(
        globalStart /
        this.apiPageSize
      ) + 1;
    if (
      requiredApiPage ===
      this.currentApiPage()
    ) {

      this.pageIndex.set(
        newPageIndex
      );


      return;

    }
    const cached =
      this.pageCache.get(
        requiredApiPage
      );


    if (
      cached
    ) {

      this.products.set(
        cached
      );


      this.currentApiPage.set(
        requiredApiPage
      );


      this.pageIndex.set(
        newPageIndex
      );
      if (
        requiredApiPage ===
        this.totalPages()
      ) {

        this.hasMore.set(
          false
        );

      }


      return;

    }
    this.loadApiPage(
      requiredApiPage,
      () => {

        this.pageIndex.set(
          newPageIndex
        );

      }
    );

  }


  // ==========================================================
  // PRICE
  // ==========================================================

  getDiscountedPrice(
    product: Product
  ): number {

    const price =
      Number(
        product.price
      ) || 0;


    const discount =
      Number(
        product.discountPercentage
      ) || 0;


    return price -
      (
        price *
        discount /
        100
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
      .subscribe(
        result => {

          if (
            result
          ) {

            this.refreshProducts();

          }

        }
      );

  }


  // ==========================================================
  // REFRESH
  // ==========================================================

  private refreshProducts(): void {

    this.pageCache.clear();
    this.totalCount.set(0);
    this.totalPages.set(0);
    this.hasMore.set(false);
    this.currentApiPage.set(1 );
 this.pageIndex.set( 0 );
 this.searchTerm.set('');
this.loadApiPage( 1);

  }


  // ==========================================================
  // DELETE
  // ==========================================================

  deleteProduct(
    id: number
  ): void {

    this.dialog
      .open(
        ConfirmDeleteComponent,
        {
          data:
            'Are you sure you want to delete this product?'
        }
      )
      .afterClosed()
      .subscribe(
        result => {

          if (
            !result?.status
          ) {

            return;

          }


          this.productService
            .deleteProduct(
              id
            )
            .subscribe({

              next: () => {

                this.refreshProducts();

              },


              error: error => {

                this.errorMessage.set(
                  error?.error?.message ??
                  'Failed to delete product.'
                );

              }

            });

        }
      );

  }


  // ==========================================================
  // IMAGE
  // ==========================================================

  getImageUrl(
    imageUrl?: string | null
  ): string {

    if (
      !imageUrl
    ) {

      return (
        'assets/images/product-placeholder.png'
      );

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


    return (
      `${environment.imageBaseUrl}${imageUrl}`
    );

  }

}