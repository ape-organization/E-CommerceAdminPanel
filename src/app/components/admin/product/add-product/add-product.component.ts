
import {
  CommonModule
} from '@angular/common';

import {
  Component,
  HostListener,
  Inject,
  OnInit,
  computed,
  inject,
  signal
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

import {
  MatButtonModule
} from '@angular/material/button';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  MatProgressSpinnerModule
} from '@angular/material/progress-spinner';

import {
  TranslatePipe
} from '@ngx-translate/core';
import { ProductService } from '../../../../services/product.service';
import { BrandService } from '../../../../services/brand.service';
import { CategoryService } from '../../../../services/category.service';
import { SubCategoryService } from '../../../../services/sub-category.service';
import { Product } from '../../../../models/product.model';
import { Brand } from '../../../../models/Brand.model';
import { Category } from '../../../../models/category.model';
import { SubCategory } from '../../../../models/subCategory.model';
import { environment } from '../../../../../environments/environment';


@Component({
  selector: 'app-add-product',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,

    TranslatePipe
  ],

  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly brandService = inject(BrandService);
  private readonly categoryService = inject(CategoryService);
  private readonly subCategoryService = inject(SubCategoryService);


  constructor(
    private readonly dialogRef: MatDialogRef<AddProductComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: {
      isEditing: boolean;
      product?: Product;
    }
  ) {}


  // =========================================================
  // SIGNALS
  // =========================================================

  readonly brands = signal<Brand[]>([]);

  readonly categories = signal<Category[]>([]);

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

  readonly selectedCategoryId =
    signal<number | null>(null);

  readonly selectedSubCategoryIds =
    signal<number[]>([]);

  readonly isSubCategoryDropdownOpen =
    signal(false);


  // =========================================================
  // COMPUTED
  // =========================================================

  readonly isEditing = computed(
    () => this.data?.isEditing === true
  );

  readonly hasImage = computed(
    () => !!this.imagePreview()
  );

  readonly selectedSubCategoryCount = computed(
    () => this.selectedSubCategoryIds().length
  );

  readonly discountedPrice = computed(() => {

    if (!this.productForm) {
      return 0;
    }

    const price =
      Number(
        this.productForm.get('sellingPrice')?.value
      ) || 0;

    const discount =
      Number(
        this.productForm.get('discountPercentage')?.value
      ) || 0;

    const validDiscount =
      Math.min(
        Math.max(discount, 0),
        100
      );

    return price -
      (price * validDiscount / 100);
  });


  readonly api =
    environment.imageBaseUrl;


  // =========================================================
  // FORM
  // =========================================================

  productForm!: FormGroup;


  // =========================================================
  // EDITING STATE
  // =========================================================

  private editingCategoryId:
    number | null = null;

  private editingSubCategoryIds:
    number[] = [];


  // =========================================================
  // INIT
  // =========================================================

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


  // =========================================================
  // FORM INITIALIZATION
  // =========================================================

  private initializeForm(): void {

    this.productForm =
      this.fb.group({

        nameEn: [
          '',
          [
            Validators.required
          ]
        ],

        nameAr: [
          '',
          [
            Validators.required
          ]
        ], actualPrice: [
          null,
          [
            Validators.required,
            Validators.min(0)
          ]
        ],
        sellingPrice: [
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
          [Validators.min(0)  ]
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

        descriptionEn: [
          ''
        ],

        descriptionAr: [
          ''
        ]

      });
  }


  // =========================================================
  // LOAD BRANDS
  // =========================================================

  private loadBrands(): void {

    this.isLoadingBrands.set(true);

    this.brandService
      .getBrands()
      .subscribe({

        next: (response: any) => {

          const brands =
            Array.isArray(response)
              ? response
              : (
                  response?.data ??
                  response?.items ??
                  []
                );

          this.brands.set(brands);

          this.isLoadingBrands.set(false);
        },

        error: (error) => {

         this.errorMessage.set(
            'Error loading brands'
          );

          this.brands.set([]);

          this.isLoadingBrands.set(false);
        }

      });
  }


  // =========================================================
  // LOAD CATEGORIES
  // =========================================================

  private loadCategories(): void {

    this.isLoadingCategories.set(true);

    this.categoryService
      .getCategories()
      .subscribe({

        next: (response: any) => {

          const categories =
            Array.isArray(response)
              ? response
              : (
                  response?.data ??
                  response?.items ??
                  []
                );

          this.categories.set(categories);

          this.isLoadingCategories.set(false);


          /*
           * If we are editing and the product
           * already has a category, load its
           * subcategories now.
           */

          if (
            this.editingCategoryId !== null
          ) {

            this.loadSubCategories(
              this.editingCategoryId,
              this.editingSubCategoryIds
            );

          }

        },

        error: (error) => {

           this.errorMessage.set(
            'Error loading categories')

          this.categories.set([]);

          this.isLoadingCategories.set(false);
        }

      });
  }


  // =========================================================
  // LOAD SUBCATEGORIES
  // =========================================================

  private loadSubCategories(
    categoryId: number,
    selectedIds: number[] = []
  ): void {

    const id = Number(categoryId);

    if (
      !id ||
      Number.isNaN(id)
    ) {

      this.selectedCategoryId.set(null);

      this.filteredSubCategories.set([]);

      this.selectedSubCategoryIds.set([]);

      this.productForm.patchValue({
        subCategoryIds: []
      });

      return;
    }


    this.selectedCategoryId.set(id);

    this.isLoadingSubCategories.set(true);


    this.subCategoryService
      .getByCategoryId(id)
      .subscribe({

        next: (response: any) => {

          const subCategories =
            Array.isArray(response)
              ? response
              : (
                  response?.data ??
                  response?.items ??
                  []
                );


          /*
           * Make sure only subcategories
           * belonging to this category
           * are displayed.
           */

          const filtered =
            subCategories.filter(
              (subCategory: SubCategory) =>
                Number(
                  subCategory.categoryId
                ) === id
            );


          this.filteredSubCategories
            .set(filtered);


          /*
           * Keep only IDs that actually
           * exist in the returned list.
           */

          const validIds =
            selectedIds
              .map(value => Number(value))
              .filter(
                value =>
                  !Number.isNaN(value)
              )
              .filter(
                value =>
                  filtered.some(
                    (                    subCategory: { id: any; }) =>
                      Number(
                        subCategory.id
                      ) === value
                  )
              );


          this.selectedSubCategoryIds
            .set(validIds);


          this.productForm.patchValue({
            subCategoryIds: validIds
          });


          this.isLoadingSubCategories
            .set(false);
        },

        error: (error) => {

          this.errorMessage.set(
            'Error loading subcategories')

          this.filteredSubCategories.set([]);

          this.selectedSubCategoryIds.set([]);

          this.productForm.patchValue({
            subCategoryIds: []
          });

          this.isLoadingSubCategories
            .set(false);
        }

      });
  }


  // =========================================================
  // CATEGORY CHANGE
  // =========================================================

  onCategorySelectChange(): void {

    const categoryId =
      Number(
        this.productForm
          .get('categoryId')
          ?.value
      );


    if (
      !categoryId ||
      Number.isNaN(categoryId)
    ) {

      this.selectedCategoryId.set(null);

      this.filteredSubCategories.set([]);

      this.selectedSubCategoryIds.set([]);

      this.productForm.patchValue({
        subCategoryIds: []
      });

      return;
    }


    this.onCategoryChange(
      categoryId
    );
  }


  onCategoryChange(
    categoryId: number
  ): void {

    const id = Number(categoryId);


    if (
      !id ||
      Number.isNaN(id)
    ) {

      this.selectedCategoryId.set(null);

      this.filteredSubCategories.set([]);

      this.selectedSubCategoryIds.set([]);

      this.productForm.patchValue({
        subCategoryIds: []
      });

      return;
    }


    this.selectedCategoryId.set(id);

    /*
     * A new category means the previous
     * subcategory selection is no longer valid.
     */

    this.selectedSubCategoryIds.set([]);

    this.productForm.patchValue({
      subCategoryIds: []
    });


    this.loadSubCategories(
      id,
      []
    );
  }


  // =========================================================
  // SUBCATEGORY DROPDOWN
  // =========================================================

  toggleSubCategoryDropdown(): void {

    if (
      !this.selectedCategoryId() ||
      this.isLoadingSubCategories()
    ) {
      return;
    }

    this.isSubCategoryDropdownOpen.update(
      value => !value
    );
  }


  // =========================================================
  // SUBCATEGORY CHECKBOX
  // =========================================================

  toggleSubCategory(
    subCategoryId: number,
    event: Event
  ): void {

    const checkbox =
      event.target as HTMLInputElement;

    const id = Number(subCategoryId);


    if (
      !id ||
      Number.isNaN(id)
    ) {
      return;
    }


    const current =
      this.selectedSubCategoryIds();


    let updated: number[];


    if (checkbox.checked) {

      if (current.includes(id)) {
        return;
      }

      updated = [
        ...current,
        id
      ];

    } else {

      updated =
        current.filter(
          value => value !== id
        );

    }


    this.onSubCategoryChange(
      updated
    );
  }


  // =========================================================
  // SUBCATEGORY CHANGE
  // =========================================================

  onSubCategoryChange(
    selectedIds: number[]
  ): void {

    const ids =
      selectedIds
        .map(id => Number(id))
        .filter(
          id =>
            !Number.isNaN(id)
        );


    this.selectedSubCategoryIds
      .set(ids);


    this.productForm.patchValue({
      subCategoryIds: ids
    });


    this.productForm
      .get('subCategoryIds')
      ?.markAsTouched();
  }


  // =========================================================
  // REMOVE SUBCATEGORY
  // =========================================================

  removeSubCategory(
    id: number
  ): void {

    const updated =
      this.selectedSubCategoryIds()
        .filter(
          value =>
            value !== Number(id)
        );


    this.onSubCategoryChange(
      updated
    );
  }


  // =========================================================
  // LOAD PRODUCT FOR EDIT
  // =========================================================

  private loadProductData(
    product: Product
  ): void {

    const subCategoryIds =
      (
        product.subCategories ?? []
      )
        .map(
          (subCategory: any) =>
            Number(subCategory.id)
        )
        .filter(
          id =>
            !Number.isNaN(id)
        );


    const categoryId =
      this.getProductCategoryId(
        product
      );


    const brandId =
      product.brand?.id ??
      (product as any).brandId ??
      null;


    const discount =
      Number(
        (product as any)
          .discountPercentage
      ) || 0;


    this.editingCategoryId =
      categoryId;

    this.editingSubCategoryIds =
      subCategoryIds;


    this.productForm.patchValue({

      nameEn:
        product.nameEn ?? '',

      nameAr:
        product.nameAr ?? '',

      actualPrice:
        product.actualPrice ?? null,
        sellingPrice:product.price??null,

      discountPercentage:
        discount,

      stockQuantity:
        product.stockQuantity ?? null,

      isInStock:
        (product as any).isInStock ?? true,

      brandId:
        brandId,

      categoryId:
        categoryId,

      subCategoryIds:
        subCategoryIds,

      descriptionEn:
        product.descriptionEn ?? '',

      descriptionAr:
        product.descriptionAr ?? ''

    });


    this.selectedCategoryId
      .set(categoryId);


    this.selectedSubCategoryIds
      .set(subCategoryIds);


    /*
     * If categories are already loaded,
     * load the subcategories immediately.
     *
     * Otherwise loadCategories() will
     * do it when the API response arrives.
     */

    if (
      categoryId !== null &&
      this.categories().length > 0
    ) {

      this.loadSubCategories(
        categoryId,
        subCategoryIds
      );

    }


    // Image

    if (product.imageUrl) {

      this.imagePreview.set(
        this.getImageUrl(
          product.imageUrl
        )
      );

    }

  }


  // =========================================================
  // GET PRODUCT CATEGORY
  // =========================================================

  private getProductCategoryId(
    product: Product
  ): number | null {

    const directCategoryId =
      (product as any)
        ?.category?.id;


    if (
      directCategoryId !== null &&
      directCategoryId !== undefined
    ) {

      const id =
        Number(directCategoryId);

      if (
        !Number.isNaN(id)
      ) {
        return id;
      }
    }


    const subCategories =
      product.subCategories ?? [];


    if (
      subCategories.length > 0
    ) {

      const categoryId =
        (subCategories[0] as any)
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


  // =========================================================
  // FILE SELECT
  // =========================================================

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
        'Only PNG, JPG, JPEG and WEBP images are allowed.'
      );

      input.value = '';

      return;
    }


    const maxSize =
      5 * 1024 * 1024;


    if (
      file.size > maxSize
    ) {

      this.errorMessage.set(
        'Image size must not exceed 5MB.'
      );

      input.value = '';

      return;
    }


    this.errorMessage.set(null);

    this.selectedFile.set(file);


    const reader =
      new FileReader();


    reader.onload =
      () => {

        this.imagePreview.set(
          reader.result as string
        );

      };


    reader.readAsDataURL(file);
  }
//===========================================
// close sub category list 
//===========================================
@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent): void {

  const target =
    event.target as HTMLElement;

  const dropdown =
    target.closest('.subcategory-dropdown');

  if (!dropdown) {

    this.isSubCategoryDropdownOpen.set(false);

  }

}
//==========================================
// show the discounted price
//==========================================
getPriceAfterDiscount(): number | null {

  const sellingPrice =
    Number(
      this.productForm.get('sellingPrice')?.value ?? 0
    );

  const discount =
    Number(
      this.productForm.get('discountPercentage')?.value ?? 0
    );

  if (
    sellingPrice <= 0 ||
    discount <= 0
  ) {
    return null;
  }

  return (
    sellingPrice -
    (sellingPrice * discount / 100)
  );
}
  // =========================================================
  // SAVE
  // =========================================================

  save(): void {

    this.errorMessage.set(null);


    if (
      this.productForm.invalid
    ) {

      this.productForm.markAllAsTouched();

      return;
    }


    const productNameEn = String( this.productForm .get('nameEn') ?.value ?? '' ).trim();
const productNameAr = String(this.productForm .get('nameAr')?.value ?? '').trim();
const actualPrice =Number(
    this.productForm.get('actualPrice')?.value ?? 0
  );

const sellingPrice =
  Number(
    this.productForm.get('sellingPrice')?.value ?? 0
  );

const discount =
  Number(
    this.productForm.get('discountPercentage')?.value ?? 0
  );

    if (
      !productNameEn &&
      !productNameAr
    ) {

      this.errorMessage.set(
        'Product name is required.'
      );

      return;
    }
 const discountedPrice = sellingPrice - (sellingPrice * discount / 100);
console.log(actualPrice > discountedPrice)
if (actualPrice > discountedPrice) {

  this.errorMessage.set(
    'Actual price must be less than the selling price after discount.'
  );

  return;
}

    this.isSubmitting.set(true);


    this.productService
      .checkProductExists(
        productNameEn
      )
      .subscribe({

        next: (exists: boolean) => {
console.log(exists)
console.log(this.isEditing())
          if (!exists  ) {
console.log("inside")
            this.errorMessage.set(
              'A product with this name already exists.'
            );

            this.isSubmitting.set(false);

            return;
          }


          if (this.isEditing()) {

            this.updateProduct();

          } else {

            this.createProduct();

          }

        },

        error: (error) => {

          this.errorMessage.set(
            'Error checking product')

          if (this.isEditing()) {

            this.updateProduct();

          } else {

            this.createProduct();

          }

        }

      });
  }


  // =========================================================
  // CREATE
  // =========================================================

  private createProduct(): void {

    const formData =
      this.buildFormData();


    this.productService
      .createProduct(formData)
      .subscribe({

        next: (response) => {

          this.isSubmitting.set(false);

          this.dialogRef.close(
            response ?? true
          );

        },

        error: (error) => {

          this.errorMessage.set(
            'Error creating product')

        

          this.isSubmitting.set(false);
        }

      });
  }


  // =========================================================
  // UPDATE
  // =========================================================

  private updateProduct(): void {

    const productId =
      this.data?.product?.id;


    if (!productId) {

      this.errorMessage.set(
        'Product ID is missing.'
      );

      this.isSubmitting.set(false);

      return;
    }


    const formData =
      this.buildFormData();


    this.productService
      .updateProduct(
        productId,
        formData
      )
      .subscribe({

        next: (response) => {

          this.isSubmitting.set(false);

          this.dialogRef.close(
            response ?? true
          );

        },

        error: (error) => {

           this.errorMessage.set(
            'Error updating product')


          this.isSubmitting.set(false);
        }

      });
  }


  // =========================================================
  // BUILD FORM DATA
  // =========================================================

  private buildFormData(): FormData {

    const value =
      this.productForm.getRawValue();


    const formData =
      new FormData();


    formData.append(
      'NameEn',
      String(value.nameEn ?? '').trim()
    );


    formData.append(
      'NameAr',
      String(value.nameAr ?? '').trim()
    );


    formData.append(
      'Price',
      String(value.sellingPrice ?? 0)
    );
 formData.append(
      'actualPrice',
      String(value.actualPrice ?? 0)
    );

    formData.append(
      'DiscountPercentage',
      String(
        value.discountPercentage ?? 0
      )
    );


    formData.append(
      'StockQuantity',
      String(
        value.stockQuantity ?? 0
      )
    );


    formData.append(
      'IsInStock',
      String(
        value.isInStock ?? false
      )
    );


    formData.append(
      'BrandId',
      String(
        value.brandId ?? ''
      )
    );


    formData.append(
      'CategoryId',
      String(
        value.categoryId ?? ''
      )
    );


    /*
     * IMPORTANT:
     *
     * Send each selected subcategory
     * as a separate SubCategoryIds value.
     */

    const subCategoryIds =
      this.selectedSubCategoryIds();


    subCategoryIds.forEach(
      id => {

        formData.append(
          'SubCategoryIds',
          String(id)
        );

      }
    );


    formData.append(
      'DescriptionEn',
      String(
        value.descriptionEn ?? ''
      )
    );


    formData.append(
      'DescriptionAr',
      String(
        value.descriptionAr ?? ''
      )
    );


    if (
      this.selectedFile()
    ) {

      formData.append(
        'Image',
        this.selectedFile()!
      );

    }


    return formData;
  }


  
  // =========================================================
  // SUBCATEGORY NAME
  // =========================================================

  getSubCategoryName(
    id: number
  ): string {

    const subCategory =
      this.filteredSubCategories()
        .find(
          item =>
            Number(item.id) ===
            Number(id)
        );


    if (!subCategory) {
      return String(id);
    }


    return `${subCategory.nameEn} - ${subCategory.nameAr}`;
  }


  // =========================================================
  // IMAGE URL
  // =========================================================

  getImageUrl(
    imageUrl: string
  ): string {

    if (
      !imageUrl
    ) {
      return '';
    }


    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://')
    ) {
      return imageUrl;
    }


    return `${this.api}${imageUrl}`;
  }


  // =========================================================
  // CANCEL
  // =========================================================

  cancel(): void {

    if (
      this.isSubmitting()
    ) {
      return;
    }

    this.dialogRef.close();
  }

}
