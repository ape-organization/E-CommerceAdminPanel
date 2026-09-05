
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

import {
  TranslatePipe
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


  // ==========================================================
  // API PAGE SIZE
  // ==========================================================

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

  readonly hasMore =
    signal(false);


  // ==========================================================
  // CURRENT API PAGE
  // ==========================================================

  readonly currentApiPage =
    signal(1);


  // ==========================================================
  // API PAGE CACHE
  //
  // IMPORTANT:
  // This MUST be a signal.
  // A normal Map does not trigger computed() updates.
  // ==========================================================

  private readonly pageCache =
    signal<Map<number, Product[]>>(
      new Map<number, Product[]>()
    );


  // ==========================================================
  // ALL PRODUCTS LOADED
  // ==========================================================

  readonly allProductsLoaded =
    computed(() => {

      const pages =
        this.totalPages();

      const cache =
        this.pageCache();

      return (
        pages > 0 &&
        !this.hasMore() &&
        cache.size >= pages
      );

    });


  // ==========================================================
  // ALL CACHED PRODUCTS
  // ==========================================================

  readonly allCachedProducts =
    computed(() => {

      const cache =
        this.pageCache();

      const allProducts: Product[] = [];

      const pages =
        Array.from(cache.keys())
          .sort((a, b) => a - b);

      for (const page of pages) {

        allProducts.push(
          ...(cache.get(page) ?? [])
        );

      }

      return allProducts;

    });


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
  // FILTER ACTIVE
  // ==========================================================

  readonly hasLocalFilters =
    computed(() =>
      !!this.selectedCategory() ||
      !!this.selectedSubCategory() ||
      !!this.selectedBrand()
    );


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

          if (!selectedCategory) {

            subCategories.add(
              subCategoryName
            );

            continue;
          }

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
  // LOCAL FILTERING
  // ==========================================================

  readonly isLocalFiltering =
    computed(() =>
      this.hasLocalFilters() ||
      (
        this.isSearchMode() &&
        this.allProductsLoaded()
      )
    );


  // ==========================================================
  // FILTERED PRODUCTS
  // ==========================================================

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


      return currentProducts.filter(product => {

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
            product.subCategories?.some(sub =>
              sub.nameEn
                ?.toLowerCase()
                .includes(term) ||
              sub.nameAr
                ?.toLowerCase()
                .includes(term)
            );

          const categoryName =
            product.subCategories?.some(sub =>
              sub.categoryName
                ?.toLowerCase()
                .includes(term)
            );

          matchesSearch =
            !!(
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
            !!product.subCategories?.some(sub =>
              sub.categoryName
                ?.trim()
                .toLowerCase() === category
            );

        }


        // ====================================================
        // SUBCATEGORY
        // ====================================================

        let matchesSubCategory = true;

        if (subCategory) {

          matchesSubCategory =
            !!product.subCategories?.some(sub =>
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
              .toLowerCase() === brand;

        }


        return (
          matchesSearch &&
          matchesCategory &&
          matchesSubCategory &&
          matchesBrand
        );

      });

    });


  // ==========================================================
  // PAGINATED PRODUCTS
  // ==========================================================

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

    if (apiPage < 1) {
      return;
    }

    if (
      this.totalPages() > 0 &&
      apiPage > this.totalPages()
    ) {
      return;
    }


    // ========================================================
    // CACHE
    // ========================================================

    const cached =
      this.pageCache()
        .get(apiPage);

    if (cached) {

      this.products.set(cached);

      this.currentApiPage.set(apiPage);

      this.isLoading.set(false);

      afterLoad?.();

      return;

    }


    // ========================================================
    // LOADING
    // ========================================================

    this.isLoading.set(true);
    this.errorMessage.set(null);


    // ========================================================
    // API
    // ========================================================

    this.productService
      .getProducts(apiPage)
      .subscribe({

        next: (
          response: PagedResponse<Product>
        ) => {

          console.log(
            'Products response:',
            response
          );


          const items =
            Array.isArray(response?.items)
              ? response.items
              : [];


          // ==================================================
          // UPDATE CACHE
          // ==================================================

          this.updatePageCache(
            apiPage,
            items
          );


          // ==================================================
          // CURRENT PRODUCTS
          // ==================================================

          this.products.set(items);

          this.currentApiPage.set(apiPage);


          // ==================================================
          // SERVER PAGINATION
          // ==================================================

          this.totalCount.set(
            Number(response?.totalCount) || 0
          );

          this.totalPages.set(
            Number(response?.totalPages) || 0
          );

          this.hasMore.set(
            !!response?.hasMore
          );


          this.isLoading.set(false);

          afterLoad?.();

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
  // UPDATE CACHE
  // ==========================================================

  private updatePageCache(
    page: number,
    products: Product[]
  ): void {

    const newCache =
      new Map(this.pageCache());

    newCache.set(
      page,
      products
    );

    this.pageCache.set(
      newCache
    );

  }


  // ==========================================================
  // LOAD ALL PRODUCTS
  // ==========================================================

  private loadAllProducts(
    afterLoad?: () => void
  ): void {

    if (this.allProductsLoaded()) {

      this.setAllProducts();

      this.isLoading.set(false);

      afterLoad?.();

      return;

    }


    const nextPage =
      this.getNextMissingPage();

    if (!nextPage) {

      this.setAllProducts();

      this.isLoading.set(false);

      afterLoad?.();

      return;

    }


    this.isLoading.set(true);
    this.errorMessage.set(null);


    this.productService
      .getProducts(nextPage)
      .subscribe({

        next: (
          response: PagedResponse<Product>
        ) => {

          const items =
            Array.isArray(response?.items)
              ? response.items
              : [];


          // ==================================================
          // CACHE
          // ==================================================

          this.updatePageCache(
            nextPage,
            items
          );


          // ==================================================
          // SERVER INFORMATION
          // ==================================================

          this.totalCount.set(
            Number(response?.totalCount) ||
            this.totalCount()
          );

          this.totalPages.set(
            Number(response?.totalPages) ||
            this.totalPages()
          );

          this.hasMore.set(
            !!response?.hasMore
          );


          // ==================================================
          // MORE PAGES
          // ==================================================

          if (response?.hasMore) {

            this.loadAllProducts(
              afterLoad
            );

            return;

          }


          // ==================================================
          // ALL DONE
          // ==================================================

          this.setAllProducts();

          this.isLoading.set(false);

          afterLoad?.();

        },

        error: error => {

          console.error(
            'Error loading all products:',
            error
          );

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
  // GET NEXT MISSING PAGE
  // ==========================================================

  private getNextMissingPage(): number | null {

    const totalPages =
      this.totalPages();

    if (totalPages <= 0) {
      return null;
    }


    const cache =
      this.pageCache();


    for (
      let page = 1;
      page <= totalPages;
      page++
    ) {

      if (!cache.has(page)) {

        return page;

      }

    }


    return null;

  }


  // ==========================================================
  // SET ALL PRODUCTS
  // ==========================================================

  private setAllProducts(): void {

    const allProducts: Product[] = [];

    const cache =
      this.pageCache();

    const pages =
      Array.from(cache.keys())
        .sort((a, b) => a - b);


    for (const page of pages) {

      allProducts.push(
        ...(cache.get(page) ?? [])
      );

    }


    this.products.set(
      allProducts
    );

    this.currentApiPage.set(1);

  }


  // ==========================================================
  // SEARCH
  // ==========================================================

  onSearch(
    value: string
  ): void {

    const term =
      value.trim();


    this.searchTerm.set(value);

    this.pageIndex.set(0);


    // ========================================================
    // EMPTY SEARCH
    // ========================================================

    if (!term) {

      if (this.hasLocalFilters()) {

        this.prepareLocalFiltering();

        return;

      }


      this.loadApiPage(1);

      return;

    }


    // ========================================================
    // LOCAL SEARCH
    // ========================================================

    if (this.allProductsLoaded()) {

      this.setAllProducts();

      return;

    }


    // ========================================================
    // API SEARCH
    // ========================================================

    this.searchProductsFromApi(term);

  }


  // ==========================================================
  // SEARCH DATABASE
  // ==========================================================

  private searchProductsFromApi(
    name: string
  ): void {

    this.isLoading.set(true);
    this.errorMessage.set(null);


    this.productService
      .getProductsByName(name)
      .subscribe({

        next: products => {

          const results =
            Array.isArray(products)
              ? products
              : [];


          this.products.set(results);

          this.currentApiPage.set(1);

          this.totalCount.set(
            results.length
          );

          this.totalPages.set(
            results.length > 0
              ? 1
              : 0
          );

          this.hasMore.set(false);

          this.isLoading.set(false);

        },

        error: error => {

          this.products.set([]);

          this.totalCount.set(0);
          this.totalPages.set(0);
          this.hasMore.set(false);

          this.errorMessage.set(
            error?.error?.message ||
            error?.message ||
            'Failed to search products.'
          );

          this.isLoading.set(false);

        }

      });

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


    // Changing category resets subcategory
    this.selectedSubCategory.set('');


    this.pageIndex.set(0);


    this.prepareLocalFiltering();

  }


  // ==========================================================
  // SUBCATEGORY FILTER
  // ==========================================================

  onSubCategoryFilterChange(
    value: string
  ): void {

    const subCategory =
      value?.trim() ?? '';


    this.selectedSubCategory.set(
      subCategory
    );


    this.pageIndex.set(0);


    this.prepareLocalFiltering();

  }


  // ==========================================================
  // BRAND FILTER
  // ==========================================================

  onBrandFilterChange(
    value: string
  ): void {

    const brand =
      value?.trim() ?? '';


    this.selectedBrand.set(
      brand
    );


    this.pageIndex.set(0);


    this.prepareLocalFiltering();

  }


  // ==========================================================
  // PREPARE LOCAL FILTERING
  // ==========================================================

  private prepareLocalFiltering(): void {

    // ========================================================
    // NO FILTERS
    // ========================================================

    if (!this.hasLocalFilters()) {

      if (this.isSearchMode()) {

        if (this.allProductsLoaded()) {

          this.setAllProducts();

        } else {

          this.searchProductsFromApi(
            this.searchTerm().trim()
          );

        }

        return;

      }


      // No filters / no search
      this.loadApiPage(1);

      return;

    }


    // ========================================================
    // FILTERS ACTIVE
    // ========================================================

    if (this.allProductsLoaded()) {

      this.setAllProducts();

      return;

    }


    // ========================================================
    // LOAD ALL PRODUCTS
    // ========================================================

    this.loadAllProducts();

  }


  // ==========================================================
  // CLEAR ALL FILTERS
  // ==========================================================

  clearFilters(): void {

    this.selectedCategory.set('');
    this.selectedSubCategory.set('');
    this.selectedBrand.set('');

    this.pageIndex.set(0);


    if (this.isSearchMode()) {

      if (this.allProductsLoaded()) {

        this.setAllProducts();

      } else {

        this.searchProductsFromApi(
          this.searchTerm().trim()
        );

      }

      return;

    }


    this.loadApiPage(1);

  }


  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  clearSearch(): void {

    this.searchTerm.set('');

    this.pageIndex.set(0);


    if (this.hasLocalFilters()) {

      this.prepareLocalFiltering();

      return;

    }


    this.loadApiPage(1);

  }


  // ==========================================================
  // PAGINATION
  // ==========================================================

  onPageChange(
    event: PageEvent
  ): void {

    const newPageIndex =
      event.pageIndex;

    const newPageSize =
      event.pageSize;


    this.pageSize.set(
      newPageSize
    );


    // ========================================================
    // LOCAL FILTERING / LOCAL SEARCH
    // ========================================================

    if (
      this.isLocalFiltering() ||
      this.isSearchMode()
    ) {

      this.pageIndex.set(
        newPageIndex
      );

      return;

    }


    // ========================================================
    // NORMAL API PAGINATION
    // ========================================================

    const globalStart =
      newPageIndex *
      newPageSize;


    const requiredApiPage =
      Math.floor(
        globalStart /
        this.apiPageSize
      ) + 1;


    const cache =
      this.pageCache();


    // ========================================================
    // SAME API PAGE
    // ========================================================

    if (
      requiredApiPage ===
      this.currentApiPage()
    ) {

      this.pageIndex.set(
        newPageIndex
      );

      return;

    }


    // ========================================================
    // CACHED PAGE
    // ========================================================

    const cached =
      cache.get(requiredApiPage);


    if (cached) {

      this.products.set(
        cached
      );

      this.currentApiPage.set(
        requiredApiPage
      );

      this.pageIndex.set(
        newPageIndex
      );

      return;

    }


    // ========================================================
    // LOAD PAGE
    // ========================================================

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
      Number(product.price) || 0;

    const discount =
      Number(product.discountPercentage) || 0;


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

    this.openProductDialog(false);

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
  // REFRESH
  // ==========================================================

  private refreshProducts(): void {

    this.pageCache.set(
      new Map<number, Product[]>()
    );

    this.totalCount.set(0);
    this.totalPages.set(0);
    this.hasMore.set(false);

    this.currentApiPage.set(1);
    this.pageIndex.set(0);

    this.searchTerm.set('');

    this.selectedCategory.set('');
    this.selectedSubCategory.set('');
    this.selectedBrand.set('');

    this.loadApiPage(1);

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

              this.errorMessage.set(
                error?.error?.message ??
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
