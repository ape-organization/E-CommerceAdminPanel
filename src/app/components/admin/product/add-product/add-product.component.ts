import { CommonModule } from '@angular/common';

import {
  Component,
  Inject,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { ProductService } from '../../../../services/product.service';
import { SubCategoryService } from '../../../../services/sub-category.service';
import { CategoryService } from '../../../../services/category.service';
import { BrandService } from '../../../../services/brand.service';
import { MatRadioModule } from '@angular/material/radio';
import { environment } from '../../../../../environments/environment';


// ============================================================
// MODELS
// ============================================================

interface Brand {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string | null;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  categoryName?: string;
}

interface Product {
  id: number;

  name: string;

  description?: string | null;

  price: number;

  discountPercentage?: number | null;

  discount?: number | null;

  isInStock: boolean;

  stockQuantity: number;

  imageUrl?: string | null;

  brandId?: number | null;

  brand?: Brand | null;

  categoryId?: number | null;

  category?: Category | null;

  subCategories?: SubCategory[];
}


// ============================================================
// COMPONENT
// ============================================================

@Component({
  selector: 'app-add-product',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatRadioModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],

  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent implements OnInit {

  // ==========================================================
  // SERVICES
  // ==========================================================

  private readonly fb =
    inject(FormBuilder);

  private readonly productService =
    inject(ProductService);

  private readonly categoryService =
    inject(CategoryService);

  private readonly subCategoryService =
    inject(SubCategoryService);

  private readonly brandService =
    inject(BrandService);


  // ==========================================================
  // DIALOG
  // ==========================================================

  constructor(
    private readonly dialogRef:
      MatDialogRef<AddProductComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: {
      isEditing: boolean;
      product?: Product;
    }
  ) {}


  // ==========================================================
  // FORM
  // ==========================================================

  productForm!: FormGroup;


  // ==========================================================
  // SIGNAL STATE
  // ==========================================================

  readonly brands =
    signal<Brand[]>([]);

  readonly categories =
    signal<Category[]>([]);

  readonly filteredSubCategories =
    signal<SubCategory[]>([]);

  readonly isLoadingSubCategories =
    signal(false);

  readonly isLoadingCategories =
    signal(false);

  readonly isLoadingBrands =
    signal(false);

  readonly isSubmitting =
    signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  readonly selectedFile =
    signal<File | null>(null);

  readonly imagePreview =
    signal<string | null>(null);

  /**
   * Currently selected category.
   *
   * This is the source of truth for
   * loading subcategories.
   */
  readonly selectedCategoryId =
    signal<number | null>(null);


  /**
   * Currently selected subcategory IDs.
   *
   * Kept separately as signal so the UI
   * does not need to depend directly on
   * FormGroup changes.
   */
  readonly selectedSubCategoryIds =
    signal<number[]>([]);


  // ==========================================================
  // EDIT STATE
  // ==========================================================

  private editingSubCategoryIds: number[] = [];

  private editingCategoryId: number | null = null;


  // ==========================================================
  // COMPUTED
  // ==========================================================

  readonly isEditing =
    computed(() =>
      this.data?.isEditing === true
    );


  readonly hasImage =
    computed(() =>
      !!this.imagePreview()
    );


  readonly selectedSubCategoryCount =
    computed(() =>
      this.selectedSubCategoryIds().length
    );


  readonly discountedPrice =
    computed(() => {

      if (!this.productForm) {
        return 0;
      }

      const price =
        Number(
          this.productForm
            .get('price')
            ?.value
        ) || 0;

      const discount =
        Number(
          this.productForm
            .get('discountPercentage')
            ?.value
        ) || 0;

      const validDiscount =
        Math.min(
          Math.max(discount, 0),
          100
        );

      return (
        price -
        (
          price *
          validDiscount /
          100
        )
      );
    });


  // ==========================================================
  // IMAGE API
  // ==========================================================

  readonly api =
    environment.imageBaseUrl;


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.initializeForm();

    this.loadBrands();

    this.loadCategories();

    if (
      this.data?.isEditing &&
      this.data?.product
    ) {

      this.loadProductData(
        this.data.product
      );
    }
  }


  // ==========================================================
  // INITIALIZE FORM
  // ==========================================================

  private initializeForm(): void {

    this.productForm =
      this.fb.group({

        name: [
          '',
          [
            Validators.required,
            Validators.maxLength(200)
          ]
        ],

        price: [
          null,
          [
            Validators.required,
            Validators.min(0)
          ]
        ],

        discountPercentage: [
          0,
          [
            Validators.min(0),
            Validators.max(100)
          ]
        ],

        stockQuantity: [
          null,
          [
            Validators.required,
            Validators.min(0)
          ]
        ],

        isInStock: [
          true
        ],

        brandId: [
          null,
          Validators.required
        ],

        categoryId: [
          null,
          Validators.required
        ],

        subCategoryIds: [
          [],
          Validators.required
        ],

        description: [
          ''
        ]

      });
  }


  // ==========================================================
  // LOAD BRANDS
  // ==========================================================

  private loadBrands(): void {

    this.isLoadingBrands.set(true);

    this.brandService
      .getBrands()
      .subscribe({

        next: (
          brands: Brand[]
        ) => {

          this.brands.set(
            brands ?? []
          );

          this.isLoadingBrands.set(
            false
          );
        },

        error: (error) => {

          console.error(
            'Failed to load brands:',
            error
          );

          this.brands.set([]);

          this.isLoadingBrands.set(
            false
          );

          this.errorMessage.set(
            'Failed to load brands.'
          );
        }

      });
  }


  // ==========================================================
  // LOAD CATEGORIES
  // ==========================================================

  private loadCategories(): void {

    this.isLoadingCategories.set(true);

    this.categoryService
      .getCategories()
      .subscribe({

        next: (
          categories: Category[]
        ) => {

          this.categories.set(
            categories ?? []
          );

          this.isLoadingCategories.set(
            false
          );

          /**
           * EDIT MODE
           *
           * The product data may have arrived
           * before the categories API.
           *
           * Once categories are available,
           * load the subcategories for the
           * selected category.
           */
          if (
            this.editingCategoryId
          ) {

            this.selectedCategoryId.set(
              this.editingCategoryId
            );

            this.loadSubCategories(
              this.editingCategoryId,
              this.editingSubCategoryIds
            );
          }

        },

        error: (error) => {

          console.error(
            'Failed to load categories:',
            error
          );

          this.categories.set([]);

          this.isLoadingCategories.set(
            false
          );

          this.errorMessage.set(
            'Failed to load categories.'
          );
        }

      });
  }


  // ==========================================================
  // LOAD SUBCATEGORIES
  // ==========================================================

  private loadSubCategories(
    categoryId: number,
    selectedIds: number[] = []
  ): void {

    const id =
      Number(categoryId);


    // --------------------------------------------------------
    // INVALID CATEGORY
    // --------------------------------------------------------

    if (
      !id ||
      Number.isNaN(id)
    ) {

      this.selectedCategoryId.set(
        null
      );

      this.filteredSubCategories.set([]);

      this.selectedSubCategoryIds.set([]);

      this.productForm
        .get('subCategoryIds')
        ?.setValue(
          [],
          {
            emitEvent: false
          }
        );

      return;
    }


    // --------------------------------------------------------
    // SET SELECTED CATEGORY
    // --------------------------------------------------------

    this.selectedCategoryId.set(
      id
    );


    // --------------------------------------------------------
    // START LOADING
    // --------------------------------------------------------

    this.isLoadingSubCategories.set(
      true
    );


    // --------------------------------------------------------
    // CLEAR OLD OPTIONS
    // --------------------------------------------------------

    this.filteredSubCategories.set([]);


    // --------------------------------------------------------
    // API
    // --------------------------------------------------------

    this.subCategoryService
      .getByCategoryId(id)
      .subscribe({

        next: (
          response: SubCategory[] | any
        ) => {

          console.log(
            'Subcategory API response:',
            response
          );


          /**
           * Normally the service should return:
           *
           * SubCategory[]
           *
           * But this also safely handles
           * common API wrapper formats.
           */
          let result: SubCategory[] = [];


          if (
            Array.isArray(response)
          ) {

            result = response;

          } else if (
            Array.isArray(response?.data)
          ) {

            result = response.data;

          } else if (
            Array.isArray(response?.items)
          ) {

            result = response.items;
          }


          /**
           * Make sure the returned subcategories
           * actually belong to this category.
           *
           * This also protects the dropdown if
           * the backend returns unexpected data.
           */
          result =
            result.filter(
              subCategory =>
                Number(
                  subCategory.categoryId
                ) === id
            );


          console.log(
            'Filtered subcategories:',
            result
          );


          // --------------------------------------------------
          // SET SIGNAL
          // --------------------------------------------------

          this.filteredSubCategories.set(
            result
          );


          // --------------------------------------------------
          // KEEP ONLY VALID SELECTED IDS
          // --------------------------------------------------

          const validIds =
            selectedIds
              .map(
                selectedId =>
                  Number(selectedId)
              )
              .filter(
                selectedId =>
                  !Number.isNaN(selectedId) &&
                  result.some(
                    subCategory =>
                      Number(
                        subCategory.id
                      ) === selectedId
                  )
              );


          // --------------------------------------------------
          // UPDATE SIGNAL
          // --------------------------------------------------

          this.selectedSubCategoryIds.set(
            validIds
          );


          // --------------------------------------------------
          // UPDATE FORM
          // --------------------------------------------------

          this.productForm
            .get('subCategoryIds')
            ?.setValue(
              validIds,
              {
                emitEvent: false
              }
            );

          this.productForm
            .get('subCategoryIds')
            ?.updateValueAndValidity();


          // --------------------------------------------------
          // FINISHED
          // --------------------------------------------------

          this.isLoadingSubCategories.set(
            false
          );
        },

        error: (error) => {

          console.error(
            'Failed to load subcategories:',
            error
          );

          this.filteredSubCategories.set([]);

          this.selectedSubCategoryIds.set([]);

          this.productForm
            .get('subCategoryIds')
            ?.setValue(
              [],
              {
                emitEvent: false
              }
            );

          this.isLoadingSubCategories.set(
            false
          );

          this.errorMessage.set(
            'Failed to load subcategories.'
          );
        }

      });
  }


  // ==========================================================
  // CATEGORY CHANGE
  // ==========================================================

  onCategoryChange(
    categoryId: number
  ): void {

    this.errorMessage.set(null);


    const id =
      Number(categoryId);


    console.log(
      'Category changed:',
      id
    );


    // --------------------------------------------------------
    // CLEAR PREVIOUS SUBCATEGORIES
    // --------------------------------------------------------

    this.editingSubCategoryIds = [];

    this.selectedSubCategoryIds.set([]);

    this.filteredSubCategories.set([]);


    this.productForm
      .get('subCategoryIds')
      ?.setValue(
        [],
        {
          emitEvent: false
        }
      );


    // --------------------------------------------------------
    // INVALID CATEGORY
    // --------------------------------------------------------

    if (
      !id ||
      Number.isNaN(id)
    ) {

      this.selectedCategoryId.set(
        null
      );

      return;
    }


    // --------------------------------------------------------
    // SET CATEGORY
    // --------------------------------------------------------

    this.selectedCategoryId.set(
      id
    );


    // --------------------------------------------------------
    // LOAD SUBCATEGORIES
    // --------------------------------------------------------

    this.loadSubCategories(
      id,
      []
    );
  }


  // ==========================================================
  // SUBCATEGORY CHANGE
  // ==========================================================

  onSubCategoryChange(
    selectedIds: number[]
  ): void {

    const ids =
      Array.isArray(selectedIds)
        ? selectedIds
            .map(
              id => Number(id)
            )
            .filter(
              id =>
                !Number.isNaN(id)
            )
        : [];


    this.selectedSubCategoryIds.set(
      ids
    );


    this.productForm
      .get('subCategoryIds')
      ?.setValue(
        ids,
        {
          emitEvent: false
        }
      );
  }


  // ==========================================================
  // LOAD PRODUCT FOR EDIT
  // ==========================================================

  private loadProductData(
    product: Product
  ): void {

    // --------------------------------------------------------
    // SUBCATEGORY IDS
    // --------------------------------------------------------

    this.editingSubCategoryIds =
      (product.subCategories ?? [])
        .map(
          subCategory =>
            Number(subCategory.id)
        )
        .filter(
          id =>
            !Number.isNaN(id)
        );


    // --------------------------------------------------------
    // CATEGORY
    // --------------------------------------------------------

    this.editingCategoryId =
      this.getProductCategoryId(
        product
      );


    // --------------------------------------------------------
    // BRAND
    // --------------------------------------------------------

    const brandId =
      product.brandId ??
      product.brand?.id ??
      null;


    // --------------------------------------------------------
    // DISCOUNT
    // --------------------------------------------------------

    const discount =
      product.discountPercentage ??
      product.discount ??
      0;


    // --------------------------------------------------------
    // PATCH FORM
    // --------------------------------------------------------

    this.productForm.patchValue({

      name:
        product.name ?? '',

      price:
        product.price ?? 0,

      discountPercentage:
        discount,

      stockQuantity:
        product.stockQuantity ?? 0,

      isInStock:
        product.isInStock ?? true,

      brandId:
        brandId,

      categoryId:
        this.editingCategoryId,

      subCategoryIds:
        [],

      description:
        product.description ?? ''

    });


    // --------------------------------------------------------
    // SET CATEGORY SIGNAL
    // --------------------------------------------------------

    if (
      this.editingCategoryId
    ) {

      this.selectedCategoryId.set(
        this.editingCategoryId
      );


      /**
       * Load subcategories immediately.
       *
       * This is safe because the API is
       * independent of the categories list.
       */
      this.loadSubCategories(
        this.editingCategoryId,
        this.editingSubCategoryIds
      );
    }


    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    if (
      product.imageUrl
    ) {

      this.imagePreview.set(
        this.getImageUrl(
          product.imageUrl
        )
      );
    }
  }


  // ==========================================================
  // GET PRODUCT CATEGORY
  // ==========================================================

  private getProductCategoryId(
    product: Product
  ): number | null {

    // --------------------------------------------------------
    // DIRECT CATEGORY ID
    // --------------------------------------------------------

    if (
      product.categoryId !== null &&
      product.categoryId !== undefined
    ) {

      const id =
        Number(
          product.categoryId
        );

      if (
        !Number.isNaN(id)
      ) {

        return id;
      }
    }


    // --------------------------------------------------------
    // CATEGORY OBJECT
    // --------------------------------------------------------

    if (
      product.category?.id !== null &&
      product.category?.id !== undefined
    ) {

      const id =
        Number(
          product.category.id
        );

      if (
        !Number.isNaN(id)
      ) {

        return id;
      }
    }


    // --------------------------------------------------------
    // SUBCATEGORY CATEGORY
    // --------------------------------------------------------

    if (
      product.subCategories &&
      product.subCategories.length > 0
    ) {

      const categoryId =
        product.subCategories[0]
          ?.categoryId;


      if (
        categoryId !== null &&
        categoryId !== undefined
      ) {

        const id =
          Number(categoryId);

        if (
          !Number.isNaN(id)
        ) {

          return id;
        }
      }
    }


    return null;
  }


  // ==========================================================
  // GET DISCOUNTED PRICE
  // ==========================================================

  getDiscountedPrice(): number {

    return this.discountedPrice();
  }


  // ==========================================================
  // FILE SELECTED
  // ==========================================================

  onFileSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    if (
      !input.files ||
      input.files.length === 0
    ) {

      return;
    }


    const file =
      input.files[0];


    // --------------------------------------------------------
    // VALIDATE TYPE
    // --------------------------------------------------------

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp'
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      this.errorMessage.set(
        'Please select a PNG, JPG or WEBP image.'
      );

      input.value = '';

      return;
    }


    // --------------------------------------------------------
    // VALIDATE SIZE
    // --------------------------------------------------------

    const maxSize =
      5 * 1024 * 1024;


    if (
      file.size > maxSize
    ) {

      this.errorMessage.set(
        'Image size must be less than 5 MB.'
      );

      input.value = '';

      return;
    }


    // --------------------------------------------------------
    // STORE FILE
    // --------------------------------------------------------

    this.selectedFile.set(
      file
    );

    this.errorMessage.set(null);


    // --------------------------------------------------------
    // PREVIEW
    // --------------------------------------------------------

    const reader =
      new FileReader();


    reader.onload = () => {

      this.imagePreview.set(
        reader.result as string
      );
    };


    reader.onerror = () => {

      this.imagePreview.set(null);

      this.selectedFile.set(null);

      this.errorMessage.set(
        'Failed to read the selected image.'
      );
    };


    reader.readAsDataURL(
      file
    );
  }


  // ==========================================================
  // SAVE
  // ==========================================================

  save(): void {

    if (
      this.productForm.invalid
    ) {

      this.productForm
        .markAllAsTouched();

      return;
    }


    if (
      this.isSubmitting()
    ) {

      return;
    }


    this.errorMessage.set(null);

    this.isSubmitting.set(true);


    const value =
      this.productForm
        .getRawValue();


    const formData =
      new FormData();


    // ========================================================
    // BASIC INFORMATION
    // ========================================================

    formData.append(
      'Name',
      String(
        value.name ?? ''
      ).trim()
    );


    formData.append(
      'Description',
      String(
        value.description ?? ''
      )
    );


    formData.append(
      'Price',
      String(
        Number(
          value.price ?? 0
        )
      )
    );


    formData.append(
      'DiscountPercentage',
      String(
        Number(
          value.discountPercentage ?? 0
        )
      )
    );


    formData.append(
      'StockQuantity',
      String(
        Number(
          value.stockQuantity ?? 0
        )
      )
    );


    formData.append(
      'IsInStock',
      String(
        value.isInStock ?? false
      )
    );


    // ========================================================
    // BRAND
    // ========================================================

    if (
      value.brandId !== null &&
      value.brandId !== undefined
    ) {

      formData.append(
        'BrandId',
        String(
          value.brandId
        )
      );
    }


    // ========================================================
    // CATEGORY
    // ========================================================

    if (
      value.categoryId !== null &&
      value.categoryId !== undefined
    ) {

      formData.append(
        'CategoryId',
        String(
          value.categoryId
        )
      );
    }


    // ========================================================
    // SUBCATEGORIES
    // ========================================================

    const subCategoryIds =
      this.selectedSubCategoryIds()
        .map(
          id =>
            Number(id)
        )
        .filter(
          id =>
            !Number.isNaN(id)
        );


    subCategoryIds.forEach(
      (id: number) => {

        formData.append(
          'SubCategoryIds',
          String(id)
        );
      }
    );


    // ========================================================
    // IMAGE
    // ========================================================

    const file =
      this.selectedFile();

    if (file) {

      formData.append(
        'Image',
        file
      );
    }


    // ========================================================
    // CREATE
    // ========================================================

    if (
      !this.data?.isEditing
    ) {

      this.productService
        .createProduct(formData)
        .subscribe({

          next: () => {

            this.isSubmitting.set(
              false
            );

            this.dialogRef.close(
              true
            );
          },

          error: (error) => {

            console.error(
              'Create product error:',
              error
            );

            this.errorMessage.set(
              this.getApiErrorMessage(
                error,
                'Failed to create product.'
              )
            );

            this.isSubmitting.set(
              false
            );
          }

        });

      return;
    }


    // ========================================================
    // UPDATE
    // ========================================================

    const productId =
      this.data?.product?.id;


    if (!productId) {

      this.errorMessage.set(
        'Product ID is missing.'
      );

      this.isSubmitting.set(
        false
      );

      return;
    }


    this.productService
      .updateProduct(
        productId,
        formData
      )
      .subscribe({

        next: () => {

          this.isSubmitting.set(
            false
          );

          this.dialogRef.close(
            true
          );
        },

        error: (error) => {

          console.error(
            'Update product error:',
            error
          );

          this.errorMessage.set(
            this.getApiErrorMessage(
              error,
              'Failed to update product.'
            )
          );

          this.isSubmitting.set(
            false
          );
        }

      });
  }


  // ==========================================================
  // API ERROR
  // ==========================================================

  private getApiErrorMessage(
    error: any,
    fallback: string
  ): string {

    if (
      error?.error?.message
    ) {

      return error.error.message;
    }


    if (
      error?.error?.title
    ) {

      return error.error.title;
    }


    if (
      typeof error?.error === 'string'
    ) {

      return error.error;
    }


    return fallback;
  }


  // ==========================================================
  // CANCEL
  // ==========================================================

  cancel(): void {

    if (
      this.isSubmitting()
    ) {

      return;
    }

    this.dialogRef.close();
  }


  // ==========================================================
  // SUBCATEGORY NAME
  // ==========================================================

  getSubCategoryName(
    id: number
  ): string {

    return (
      this.filteredSubCategories()
        .find(
          subCategory =>
            Number(subCategory.id) ===
            Number(id)
        )
        ?.name ??
      'Selected'
    );
  }


  // ==========================================================
  // IMAGE URL
  // ==========================================================

  private getImageUrl(
    imageUrl: string
  ): string {

    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://')
    ) {

      return imageUrl;
    }


    return `${this.api}${imageUrl}`;
  }
}