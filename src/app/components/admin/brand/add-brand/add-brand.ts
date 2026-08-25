import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  inject
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


@Component({
  selector: 'app-add-brand',

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
    './add-brand.html',

  styleUrl:
    './add-brand.scss'
})
export class AddBrand
  implements OnInit {


  // =====================================================
  // SERVICES
  // =====================================================

  private fb =
    inject(FormBuilder);


  private brandService =
    inject(BrandService);


  // =====================================================
  // FORM
  // =====================================================

  brandForm:
    FormGroup;


  // =====================================================
  // IMAGE
  // =====================================================

  imagePreview:
    string | null = null;


  selectedImage:
    File | null = null;


  // =====================================================
  // STATE
  // =====================================================

  errorMessage:
    string | null = null;


  isSubmitting =
    false;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    private dialogRef:
      MatDialogRef<AddBrand>,

    @Inject(MAT_DIALOG_DATA)
    public data: any,

    private cdr:
      ChangeDetectorRef

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
      !this.data.add &&
      this.data.brand
    ) {

      this.brandForm.patchValue({

        name:
          this.data.brand.name || ''

      });


      /*
       * Existing image
       */

      this.imagePreview =
        this.data.brand.imageUrl || null;

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


    // -----------------------------------------------
    // Validate image
    // -----------------------------------------------

    if (
      !file.type.startsWith('image/')
    ) {

      this.errorMessage =
        'Please select a valid image file.';

      input.value = '';

      return;

    }


    // -----------------------------------------------
    // Maximum 5 MB
    // -----------------------------------------------

    const maxSize =
      5 * 1024 * 1024;


    if (
      file.size > maxSize
    ) {

      this.errorMessage =
        'Image size must be less than 5 MB.';

      input.value = '';

      return;

    }


    // -----------------------------------------------
    // Save file
    // -----------------------------------------------

    this.selectedImage =
      file;


    this.errorMessage =
      null;


    // -----------------------------------------------
    // Preview
    // -----------------------------------------------

    const reader =
      new FileReader();


    reader.onload = () => {

      this.imagePreview =
        reader.result as string;

      this.cdr.detectChanges();

    };


    reader.readAsDataURL(file);

  }


  // =====================================================
  // SUBMIT
  // =====================================================

  async onSubmit(): Promise<void> {

    if (
      this.brandForm.invalid ||
      this.isSubmitting
    ) {

      this.brandForm.markAllAsTouched();

      return;

    }


    this.errorMessage =
      null;

    this.isSubmitting =
      true;


    try {

      // -----------------------------------------------
      // FormData
      // -----------------------------------------------

      const formData =
        new FormData();


      // -----------------------------------------------
      // Name
      // -----------------------------------------------

      formData.append(
        'Name',
        this.brandForm.value.name
      );


      // -----------------------------------------------
      // Image
      // -----------------------------------------------

      if (this.selectedImage) {

        formData.append(

          'Image',

          this.selectedImage,

          this.selectedImage.name

        );

      }


      // -----------------------------------------------
      // UPDATE
      // -----------------------------------------------

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
 this.errorMessage =
      'Brand update failed';
         /*  throw new Error(
            'Brand update failed'
          ); */

        }

      }


      // -----------------------------------------------
      // CREATE
      // -----------------------------------------------

      else {

        const response =
          await firstValueFrom(

            this.brandService.addBrand(
              formData
            )

          );


        if (!response) {
this.errorMessage ='Brand creation failed'
          /* throw new Error(
            'Brand creation failed'
          ); */

        }

      }


      // -----------------------------------------------
      // SUCCESS
      // -----------------------------------------------

      this.dialogRef.close({
        status: true
      });

    }


    catch (error) {

    


      this.errorMessage =
        'Something went wrong while saving the brand.';


      this.isSubmitting =
        false;


      this.cdr.detectChanges();

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