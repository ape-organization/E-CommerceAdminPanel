import {
  Component,
  Inject,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { MatIconModule } from '@angular/material/icon';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import { firstValueFrom } from 'rxjs';

import { CategoryService } from '../../../../services/category.service';
import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-add-category',

  standalone: true,

  imports: [
    TranslatePipe,
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],

  templateUrl:
    './add-category.component.html',

  styleUrl:
    './add-category.component.scss'
})
export class AddCategoryComponent
  implements OnInit {


  // =========================================================
  // SERVICES
  // =========================================================

  private readonly fb =
    inject(FormBuilder);

  private readonly categoryService =
    inject(CategoryService);

  private readonly dialogRef =
    inject(MatDialogRef<AddCategoryComponent>);


  // =========================================================
  // DIALOG DATA
  // =========================================================

  constructor(

    @Inject(MAT_DIALOG_DATA)
    public readonly data: any

  ) {}


  // =========================================================
  // FORM
  // =========================================================

  readonly categoryForm: FormGroup =
    this.fb.group({

      name: [
        '',
        Validators.required
      ],

      description: [
        ''
      ]

    });


  // =========================================================
  // SIGNAL STATE
  // =========================================================

  readonly errorMessage =
    signal<string | null>(null);

  readonly imagePreview =
    signal<string | null>(null);

  readonly selectedImage =
    signal<File | null>(null);

  readonly isSubmitting =
    signal(false);


  // =========================================================
  // DERIVED STATE
  // =========================================================

  readonly isAdd =
    computed(() =>
      this.data?.add === true
    );


  readonly dialogTitle =
    computed(() =>
      this.isAdd()
        ? 'Add New Category'
        : 'Edit Category'
    );


  readonly dialogDescription =
    computed(() =>
      this.isAdd()
        ? 'Create a new product category'
        : 'Update category information'
    );


  readonly submitText =
    computed(() => {

      if (this.isSubmitting()) {

        return 'SAVING...';

      }

      return this.isAdd()
        ? 'CREATE CATEGORY'
        : 'UPDATE CATEGORY';

    });


  readonly submitIcon =
    computed(() =>
      this.isAdd()
        ? 'add'
        : 'save'
    );


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    if (
      !this.isAdd() &&
      this.data?.category
    ) {

      this.categoryForm.patchValue({

        name:
          this.data.category.name ?? '',

        description:
          this.data.category.description ?? ''

      });


      this.imagePreview.set(
        this.data.category.imageUrl ?? null
      );

    }

  }


  // =========================================================
  // SELECT IMAGE
  // =========================================================

  onImageSelected(
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


    // =======================================================
    // VALIDATE TYPE
    // =======================================================

    if (
      !file.type.startsWith('image/')
    ) {

      this.errorMessage.set(
        'Please select a valid image file.'
      );

      input.value = '';

      return;

    }


    // =======================================================
    // VALIDATE SIZE
    // =======================================================

    const maxSize =
      5 * 1024 * 1024;


    if (file.size > maxSize) {

      this.errorMessage.set(
        'Image size must be less than 5 MB.'
      );

      input.value = '';

      return;

    }


    // =======================================================
    // SAVE IMAGE
    // =======================================================

    this.selectedImage.set(file);

    this.errorMessage.set(null);


    // =======================================================
    // PREVIEW
    // =======================================================

    const reader =
      new FileReader();


    reader.onload = () => {

      this.imagePreview.set(
        reader.result as string
      );

    };


    reader.onerror = () => {

      this.errorMessage.set(
        'Failed to load the selected image.'
      );

    };


    reader.readAsDataURL(file);

  }


  // =========================================================
  // SUBMIT
  // =========================================================

  async onSubmit(): Promise<void> {

    if (
      this.categoryForm.invalid ||
      this.isSubmitting()
    ) {

      this.categoryForm.markAllAsTouched();

      return;

    }


    this.errorMessage.set(null);

    this.isSubmitting.set(true);


    try {

      const formData =
        new FormData();


      // =====================================================
      // NAME
      // =====================================================

      formData.append(
        'Name',
        this.categoryForm
          .get('name')
          ?.value ?? ''
      );


      // =====================================================
      // DESCRIPTION
      // =====================================================

      formData.append(
        'Description',
        this.categoryForm
          .get('description')
          ?.value ?? ''
      );


      // =====================================================
      // IMAGE
      // =====================================================

      const image =
        this.selectedImage();


      if (image) {

        formData.append(
          'Image',
          image,
          image.name
        );

      }


      // =====================================================
      // UPDATE
      // =====================================================

      if (
        !this.isAdd() &&
        this.data?.category
      ) {

        const categoryId =
          this.data.category.id;


        formData.append(
          'Id',
          categoryId.toString()
        );


        const response =
          await firstValueFrom(

            this.categoryService.updateCategory(
              categoryId,
              formData
            )

          );


        if (!response) {

          throw new Error(
            'Category update failed.'
          );

        }

      }


      // =====================================================
      // CREATE
      // =====================================================

      else {

        const response =
          await firstValueFrom(

            this.categoryService.addCategory(
              formData
            )

          );


        if (!response) {

          throw new Error(
            'Category creation failed.'
          );

        }

      }


      // =====================================================
      // SUCCESS
      // =====================================================

      this.dialogRef.close({

        status: true

      });

    }


    catch (error) {

      console.error(
        'Error saving category:',
        error
      );


      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving the category.'
      );

      this.isSubmitting.set(false);

    }

  }


  // =========================================================
  // CANCEL
  // =========================================================

  onCancel(): void {

    if (this.isSubmitting()) {

      return;

    }


    this.dialogRef.close({

      status: false

    });

  }

}