import { CommonModule } from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  inject
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

  // New backend property
  discountPercentage?: number | null;

  // Keep this for compatibility if old API response is still used
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
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule
  ],

  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent implements OnInit {

  // ==========================================================
  // SERVICES
  // ==========================================================

  private readonly fb = inject(FormBuilder);

  private readonly productService =
    inject(ProductService);

  private readonly categoryService =
    inject(CategoryService);

  private readonly subCategoryService =
    inject(SubCategoryService);

  private readonly brandService =
    inject(BrandService);

  private readonly cdr =
    inject(ChangeDetectorRef);


  // ==========================================================
  // FORM
  // ==========================================================

  productForm!: FormGroup;


  // ==========================================================
  // DATA
  // ==========================================================

  brands: Brand[] = [];

  categories: Category[] = [];

  filteredSubCategories: SubCategory[] = [];


  // ==========================================================
  // EDIT DATA
  // ==========================================================

  private editingSubCategoryIds: number[] = [];

  private editingCategoryId: number | null = null;


  // ==========================================================
  // IMAGE
  // ==========================================================

  selectedFile: File | null = null;

  imagePreview:
    string |
    ArrayBuffer |
    null = null;


  // ==========================================================
  // STATE
  // ==========================================================

  isSubmitting = false;

  errorMessage: string | null = null;


  // ==========================================================
  // CONSTRUCTOR
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

    this.brandService
      .getBrands()
      .subscribe({

        next: (brands: Brand[]) => {

          this.brands =
            brands ?? [];

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Failed to load brands:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'Failed to load brands.';

          this.cdr.detectChanges();
        }

      });
  }


  // ==========================================================
  // LOAD CATEGORIES
  // ==========================================================

  private loadCategories(): void {

    this.categoryService
      .getCategories()
      .subscribe({

        next: (categories: Category[]) => {

          this.categories =
            categories ?? [];

          /*
           * If we are editing and already know the category,
           * load its subcategories now.
           */
          const categoryId =
            this.productForm
              .get('categoryId')
              ?.value;

          if (categoryId) {

            this.loadSubCategories(
              Number(categoryId),
              this.editingSubCategoryIds
            );
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Failed to load categories:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'Failed to load categories.';

          this.cdr.detectChanges();
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

    if (!categoryId) {

      this.filteredSubCategories = [];

      this.productForm
        .get('subCategoryIds')
        ?.setValue([]);

      this.cdr.detectChanges();

      return;
    }

    this.subCategoryService
      .getByCategoryId(categoryId)
      .subscribe({

        next: (
          subCategories: SubCategory[]
        ) => {

          this.filteredSubCategories =
            subCategories ?? [];

          /*
           * Only select IDs that actually belong
           * to the selected category.
           */
          const validIds =
            selectedIds
              .map(id => Number(id))
              .filter(id =>
                this.filteredSubCategories.some(
                  sc => Number(sc.id) === id
                )
              );

          this.productForm
            .get('subCategoryIds')
            ?.setValue(validIds);

          this.productForm
            .get('subCategoryIds')
            ?.updateValueAndValidity();

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Failed to load subcategories:',
            error
          );

          this.filteredSubCategories = [];

          this.productForm
            .get('subCategoryIds')
            ?.setValue([]);

          this.errorMessage =
            error?.error?.message ??
            'Failed to load subcategories.';

          this.cdr.detectChanges();
        }

      });
  }


  // ==========================================================
  // CATEGORY CHANGE
  // ==========================================================

  onCategoryChange(
    categoryId: number
  ): void {

    this.errorMessage = null;

    /*
     * User manually changed the category.
     * The old subcategories must NOT remain selected.
     */
    this.editingSubCategoryIds = [];

    this.productForm
      .get('subCategoryIds')
      ?.setValue([]);

    this.filteredSubCategories = [];

    if (!categoryId) {

      return;
    }

    this.loadSubCategories(
      Number(categoryId),
      []
    );
  }


  // ==========================================================
  // LOAD PRODUCT FOR EDIT
  // ==========================================================

  private loadProductData(
    product: Product
  ): void {

    /*
     * ==============================================
     * GET SUBCATEGORY IDS
     * ==============================================
     */

    this.editingSubCategoryIds =
      (product.subCategories ?? [])
        .map(sc => Number(sc.id))
        .filter(id => !isNaN(id));


    /*
     * ==============================================
     * GET CATEGORY ID
     * ==============================================
     */

    this.editingCategoryId =
      this.getProductCategoryId(product);


    /*
     * ==============================================
     * GET BRAND ID
     * ==============================================
     */

    const brandId =
      product.brandId ??
      product.brand?.id ??
      null;


    /*
     * ==============================================
     * GET DISCOUNT
     * ==============================================
     *
     * New API:
     *     discountPercentage
     *
     * Old API compatibility:
     *     discount
     */

    const discount =
      product.discountPercentage ??
      product.discount ??
      0;


    /*
     * ==============================================
     * PATCH FORM
     * ==============================================
     */

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

      /*
       * IMPORTANT:
       *
       * Don't set the subcategory IDs here yet.
       * The mat-select options have not necessarily
       * been loaded.
       *
       * loadSubCategories() will set them after
       * receiving the options.
       */
      subCategoryIds:
        [],

      description:
        product.description ?? ''

    });


    /*
     * ==============================================
     * LOAD SUBCATEGORIES
     * ==============================================
     */

    if (this.editingCategoryId) {

      this.loadSubCategories(
        this.editingCategoryId,
        this.editingSubCategoryIds
      );
    }


    /*
     * ==============================================
     * IMAGE
     * ==============================================
     */

    if (product.imageUrl) {

      this.imagePreview =
        this.getImageUrl(
          product.imageUrl
        );
    }


    this.cdr.detectChanges();
  }


  // ==========================================================
  // GET PRODUCT CATEGORY
  // ==========================================================

  private getProductCategoryId(
    product: Product
  ): number | null {

    /*
     * First try direct categoryId.
     */

    if (
      product.categoryId !== null &&
      product.categoryId !== undefined
    ) {

      return Number(
        product.categoryId
      );
    }


    /*
     * Then try category.id.
     */

    if (
      product.category?.id
    ) {

      return Number(
        product.category.id
      );
    }


    /*
     * Finally get category from
     * the first subcategory.
     */

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

        return Number(
          categoryId
        );
      }
    }


    return null;
  }


  // ==========================================================
  // GET DISCOUNTED PRICE
  // ==========================================================

  getDiscountedPrice(): number {

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
        Math.max(
          discount,
          0
        ),
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


    // ============================
    // VALIDATE TYPE
    // ============================

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

      alert(
        'Please select a PNG, JPG or WEBP image.'
      );

      input.value = '';

      return;
    }


    // ============================
    // VALIDATE SIZE
    // ============================

    const maxSize =
      5 * 1024 * 1024;


    if (
      file.size > maxSize
    ) {

      alert(
        'Image size must be less than 5 MB.'
      );

      input.value = '';

      return;
    }


    // ============================
    // STORE FILE
    // ============================

    this.selectedFile =
      file;


    // ============================
    // CREATE PREVIEW
    // ============================

    const reader =
      new FileReader();


    reader.onload = () => {

      this.imagePreview =
        reader.result;

      this.cdr.detectChanges();
    };


    reader.onerror = () => {

      this.imagePreview = null;

      this.selectedFile = null;

      this.cdr.detectChanges();
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
      this.isSubmitting
    ) {

      return;
    }


    this.errorMessage = null;

    this.isSubmitting = true;


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


    /*
     * IMPORTANT:
     *
     * Backend property:
     *
     * DiscountPercentage
     */

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
    //
    // If your backend DOES NOT have CategoryId
    // in the request model, don't append it.
    //
    // SubCategoryIds are enough to determine
    // the category in your current backend design.
    //
    // ========================================================


    // ========================================================
    // SUBCATEGORIES
    // ========================================================

    const subCategoryIds =
      (
        value.subCategoryIds ?? []
      )
        .map((id: number | string) =>
          Number(id)
        )
        .filter((id: number) =>
          !isNaN(id)
        );


    /*
     * Send:
     *
     * SubCategoryIds=1
     * SubCategoryIds=3
     * SubCategoryIds=5
     *
     * instead of:
     *
     * SubCategoryIds=[1,3,5]
     */

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

    if (
      this.selectedFile
    ) {

      formData.append(
        'Image',
        this.selectedFile
      );
    }


    // ========================================================
    // DEBUG FORM DATA
    // ========================================================

    /*
     * Uncomment this temporarily if you want
     * to verify exactly what is being sent.
     *
     * formData.forEach((value, key) => {
     *   console.log(key, value);
     * });
     */


    // ========================================================
    // CREATE
    // ========================================================

    if (
      !this.data?.isEditing
    ) {

      this.productService
        .createProduct(
          formData
        )
        .subscribe({

          next: () => {

            this.isSubmitting =
              false;

            this.dialogRef.close(
              true
            );
          },

          error: (error) => {

            console.error(
              'Create product error:',
              error
            );

            this.errorMessage =
              error?.error?.message ??
              'Failed to create product.';

            this.isSubmitting =
              false;

            this.cdr.detectChanges();
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

      this.errorMessage =
        'Product ID is missing.';

      this.isSubmitting =
        false;

      return;
    }


    this.productService
      .updateProduct(
        productId,
        formData
      )
      .subscribe({

        next: () => {

          this.isSubmitting =
            false;

          this.dialogRef.close(
            true
          );
        },

        error: (error) => {

          console.error(
            'Update product error:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'Failed to update product.';

          this.isSubmitting =
            false;

          this.cdr.detectChanges();
        }

      });
  }


  // ==========================================================
  // CANCEL
  // ==========================================================

  cancel(): void {

    if (
      this.isSubmitting
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
      this.filteredSubCategories
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
api=environment.imageBaseUrl
  private getImageUrl(
    imageUrl: string
  ): string {

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


    return `${this.api}${imageUrl}`;
  }
}