import {
  Component,
  Inject,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import {
  MatButtonModule
} from '@angular/material/button';

import {
  MatFormFieldModule
} from '@angular/material/form-field';

import {
  MatInputModule
} from '@angular/material/input';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import {
  firstValueFrom
} from 'rxjs';

import {
  BrandService
} from '../../../../services/brand.service';
import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-add-brand',

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

  templateUrl: './add-brand.html',

  styleUrl: './add-brand.scss'
})
export class AddBrand implements OnInit {

  // =====================================================
  // SERVICES
  // =====================================================

  private readonly fb =
    inject(FormBuilder);

  private readonly brandService =
    inject(BrandService);


  // =====================================================
  // FORM
  // =====================================================

  brandForm: FormGroup;


  // =====================================================
  // SIGNAL STATE
  // =====================================================

  readonly imagePreview =
    signal<string | null>(null);

  readonly selectedImage =
    signal<File | null>(null);

  readonly errorMessage =
    signal<string | null>(null);

  readonly isSubmitting =
    signal(false);


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    private readonly dialogRef:
      MatDialogRef<AddBrand>,

    @Inject(MAT_DIALOG_DATA)
    public readonly data: any

  ) {

    this.brandForm =
      this.fb.group({

        name: [
          '',
          Validators.required
        ]

      });

  }


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    if (
      !this.data?.add &&
      this.data?.brand
    ) {

      this.brandForm.patchValue({

        name:
          this.data.brand.name || ''

      });


      // Existing image

      this.imagePreview.set(
        this.data.brand.imageUrl || null
      );

    }

  }


  // =====================================================
  // IMAGE SELECT
  // =====================================================

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


    // ===================================================
    // VALIDATE TYPE
    // ===================================================

    if (
      !file.type.startsWith('image/')
    ) {

      this.errorMessage.set(
        'Please select a valid image file.'
      );

      input.value = '';

      return;

    }


    // ===================================================
    // VALIDATE SIZE
    // ===================================================

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


    // ===================================================
    // SAVE SELECTED FILE
    // ===================================================

    this.selectedImage.set(file);

    this.errorMessage.set(null);


    // ===================================================
    // CREATE PREVIEW
    // ===================================================

    const reader =
      new FileReader();


    reader.onload = () => {

      this.imagePreview.set(
        reader.result as string
      );

    };


    reader.readAsDataURL(file);

  }


  // =====================================================
  // SUBMIT
  // =====================================================

  async onSubmit(): Promise<void> {

    // Prevent duplicate submission

    if (
      this.brandForm.invalid ||
      this.isSubmitting()
    ) {

      this.brandForm.markAllAsTouched();

      return;

    }


    this.errorMessage.set(null);

    this.isSubmitting.set(true);


    try {

      // =================================================
      // FORM DATA
      // =================================================

      const formData =
        new FormData();


      // =================================================
      // NAME
      // =================================================

      formData.append(
        'Name',
        this.brandForm.get('name')?.value
      );


      // =================================================
      // IMAGE
      // =================================================

      const image =
        this.selectedImage();


      if (image) {

        formData.append(
          'Image',
          image,
          image.name
        );

      }


      // =================================================
      // UPDATE
      // =================================================

      if (
        !this.data.add &&
        this.data.brand
      ) {

        const response =
          await firstValueFrom(

            this.brandService.updateBrand(
              this.data.brand.id,
              formData
            )

          );


        if (!response) {

          this.errorMessage.set(
            'Brand update failed.'
          );

          this.isSubmitting.set(false);

          return;

        }

      }


      // =================================================
      // CREATE
      // =================================================

      else {

        const response =
          await firstValueFrom(

            this.brandService.addBrand(
              formData
            )

          );


        if (!response) {

          this.errorMessage.set(
            'Brand creation failed.'
          );

          this.isSubmitting.set(false);

          return;

        }

      }


      // =================================================
      // SUCCESS
      // =================================================

      this.dialogRef.close({

        status: true

      });

    }


    catch (error) {

      console.error(
        'Error saving brand:',
        error
      );


      this.errorMessage.set(
        'Something went wrong while saving the brand.'
      );


      this.isSubmitting.set(false);

    }

  }


  // =====================================================
  // CANCEL
  // =====================================================

  onCancel(): void {

    this.dialogRef.close({

      status: false

    });

  }

}