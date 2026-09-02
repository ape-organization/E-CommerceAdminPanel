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
  TranslatePipe
} from '@ngx-translate/core';

import {
  BrandService
} from '../../../../services/brand.service';

import {
  LanguageService
} from '../../../../services/language.service';
import { environment } from '../../../../../environments/environment';


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

  readonly languageService =
    inject(LanguageService);


  // =====================================================
  // FORM
  // =====================================================

  readonly brandForm: FormGroup =
    this.fb.group({

      nameAr: [
        '',
        Validators.required
      ],

      nameEn: [
        '',
        Validators.required
      ]

    });


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

  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    if (
      !this.data?.add &&
      this.data?.brand
    ) {

      this.brandForm.patchValue({

        nameAr:
          this.data.brand.nameAr || '',

        nameEn:
          this.data.brand.nameEn || ''

      });


      // Existing image
var image=environment.imageBaseUrl+this.data.brand.imageUrl

      this.imagePreview.set(
        image|| null
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


    const file =
      input.files?.[0];


    if (!file) {
      return;
    }


    // ===================================================
    // VALIDATE TYPE
    // ===================================================

    if (
      !file.type.startsWith('image/')
    ) {

      this.errorMessage.set(
        'brands.invalidImage'
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
        'brands.imageTooLarge'
      );

      input.value = '';

      return;

    }


    // ===================================================
    // SAVE FILE
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
      // NAMES
      // =================================================

      const nameAr =
        this.brandForm
          .get('nameAr')
          ?.value
          ?.trim() ?? '';


      const nameEn =
        this.brandForm
          .get('nameEn')
          ?.value
          ?.trim() ?? '';


      formData.append(
        'NameAr',
        nameAr
      );


      formData.append(
        'NameEn',
        nameEn
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
            'brands.updateFailed'
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
            'brands.createFailed'
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
        'brands.saveError'
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