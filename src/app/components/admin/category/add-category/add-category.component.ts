import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { MatIconModule } from '@angular/material/icon';

import { Category } from '../../../../models/category.model';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import { firstValueFrom } from 'rxjs';

import { CategoryService } from '../../../../services/category.service';


@Component({
  selector: 'app-add-category',

  standalone: true,

  imports: [
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


  private fb =
    inject(FormBuilder);


  private categoryService =
    inject(CategoryService);


  categoryForm: FormGroup;


  errorMessage:
    string | null = null;


  imagePreview:
    string | null = null;


  selectedImage:
    File | null = null;


  isSubmitting = false;


  constructor(

    private dialogRef:
      MatDialogRef<AddCategoryComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: any,

    private cdr:
      ChangeDetectorRef

  ) {

    this.categoryForm =
      this.fb.group({

        name: [
          '',
          Validators.required
        ],

        description: [
          ''
        ]

      });

  }


  ngOnInit(): void {

    /*
     * EDIT CATEGORY
     */

    if (
      !this.data.add &&
      this.data.category
    ) {

      this.categoryForm.patchValue({

        name:
          this.data.category.name || '',

        description:
          this.data.category.description || ''

      });


      /*
       * Show existing category image
       */

      this.imagePreview =
        this.data.category.imageUrl || null;

    }

  }


  /* =========================================
     SELECT IMAGE
     ========================================= */

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


    /*
     * Validate image type
     */

    if (!file.type.startsWith('image/')) {

      this.errorMessage =
        'Please select a valid image file.';

      input.value = '';

      return;

    }


    /*
     * Optional size validation
     * 5 MB maximum
     */

    const maxSize =
      5 * 1024 * 1024;


    if (file.size > maxSize) {

      this.errorMessage =
        'Image size must be less than 5 MB.';

      input.value = '';

      return;

    }


    /*
     * Save selected file
     */

    this.selectedImage = file;

    this.errorMessage = null;


    /*
     * Create preview
     */

    const reader =
      new FileReader();


    reader.onload =
      () => {

        this.imagePreview =
          reader.result as string;

        this.cdr.detectChanges();

      };


    reader.readAsDataURL(file);

  }


  /* =========================================
     SUBMIT
     ========================================= */

  async onSubmit(): Promise<void> {

    if (
      this.categoryForm.invalid ||
      this.isSubmitting
    ) {

      this.categoryForm.markAllAsTouched();

      return;

    }


    this.errorMessage = null;

    this.isSubmitting = true;


    try {

      /*
       * Create FormData
       */

      const formData =
        new FormData();


      /*
       * Category name
       */

      formData.append(
        'Name',
        this.categoryForm.value.name
      );


      /*
       * Description
       */

      formData.append(
        'Description',
        this.categoryForm.value.description || ''
      );


      /*
       * Image
       *
       * Only append when the user
       * selected a new image.
       */

      if (this.selectedImage) {

        formData.append(
          'Image',
          this.selectedImage,
          this.selectedImage.name
        );

      }


      /*
       * EDIT
       */

      if (
        !this.data.add &&
        this.data.category
      ) {

        formData.append(
          'Id',
          this.data.category.id.toString()
        );


        const res =
          await firstValueFrom(
            this.categoryService.updateCategory(
              this.data.category.id,
              formData
            )
          );


        if (!res) {
this.errorMessage = 'Category update failed'
         /*  throw new Error(
            'Category update failed'
          ); */

        }

      }


      /*
       * ADD
       */

      else {

        const res =
          await firstValueFrom(
            this.categoryService.addCategory(
              formData
            )
          );


        if (!res) {
this.errorMessage = 'Category creation failed'
         /*  throw new Error(
            'Category creation failed'
          ); */

        }

      }


      /*
       * SUCCESS
       */

      this.dialogRef.close({
        status: true
      });


    } catch (error) {

    


      this.errorMessage =
        'Something went wrong while saving the category.';


      this.isSubmitting = false;

      this.cdr.detectChanges();

    }

  }


  /* =========================================
     CANCEL
     ========================================= */

  onCancel(): void {

    this.dialogRef.close({
      status: false
    });

  }

}