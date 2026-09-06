import {
  Component,
  Inject,
  OnInit,
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

import { MatIconModule } from '@angular/material/icon';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import { firstValueFrom } from 'rxjs';

import {
  CategoryService
} from '../../../../services/category.service';

import {
  TranslatePipe
} from '@ngx-translate/core';

import {
  environment
} from '../../../../../environments/environment';


@Component({
  selector: 'app-add-category',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe
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

      nameEn: [
        '',
        Validators.required
      ],

      nameAr: [
        '',
        Validators.required
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

  readonly isEditing =
    signal(false);


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    /*
     * data.add = true  -> CREATE
     * data.add = false -> EDIT
     */

    this.isEditing.set(
      !this.data?.add
    );
console.log(this.isEditing())

    /*
     * =========================================
     * EDIT EXISTING CATEGORY
     * =========================================
     */

    if (
      this.isEditing() &&
      this.data?.category
    ) {

      this.categoryForm.patchValue({

        nameAr:
          this.data.category.nameAr ?? '',

        nameEn:
          this.data.category.nameEn ?? ''

      });


      /*
       * Existing image
       */

      if (
        this.data.category.imageUrl
      ) {

        const image =
          environment.imageBaseUrl +
          this.data.category.imageUrl;

        this.imagePreview.set(
          image
        );

      }

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


    if (
      file.size > maxSize
    ) {

      this.errorMessage.set(
        'Image size must be less than 5 MB.'
      );

      input.value = '';

      return;

    }


    // =======================================================
    // SAVE IMAGE
    // =======================================================

    this.selectedImage.set(
      file
    );

    this.errorMessage.set(
      null
    );


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


    reader.readAsDataURL(
      file
    );

  }


  // =========================================================
  // SUBMIT
  // =========================================================

  async onSubmit(): Promise<void> {

    /*
     * =========================================
     * VALIDATE
     * =========================================
     */

    if (
      this.categoryForm.invalid ||
      this.isSubmitting()
    ) {

      this.categoryForm.markAllAsTouched();

      return;

    }


    this.errorMessage.set(
      null
    );

    this.isSubmitting.set(
      true
    );


    try {

      const formData =
        new FormData();


      // =====================================================
      // NAME AR
      // =====================================================

      formData.append(
        'NameAr',
        this.categoryForm
          .get('nameAr')
          ?.value?.trim() ?? ''
      );


      // =====================================================
      // NAME EN
      // =====================================================

      formData.append(
        'NameEn',
        this.categoryForm
          .get('nameEn')
          ?.value?.trim() ?? ''
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
        this.isEditing() &&
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


      this.errorMessage.set('Something went wrong while saving the category.'

      );


      this.isSubmitting.set(
        false
      );

    }

  }


  // =========================================================
  // CANCEL
  // =========================================================

  onCancel(): void {

    if (
      this.isSubmitting()
    ) {

      return;

    }


    this.dialogRef.close({

      status: false

    });

  }

}