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

import { TranslatePipe } from '@ngx-translate/core';
import { SliderService } from '../../../../services/slider.service';
import { environment } from '../../../../../environments/environment';


@Component({
  selector: 'app-add-slider',

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
    './add-slider.component.html',

  styleUrl:
    './add-slider.component.scss'
})
export class AddSliderComponent
  implements OnInit {


  // =========================================================
  // SERVICES
  // =========================================================

  private readonly fb =
    inject(FormBuilder);

  private readonly sliderService =
    inject(SliderService);

  private readonly dialogRef =
    inject(MatDialogRef<AddSliderComponent>);


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

  readonly sliderForm: FormGroup =
    this.fb.group({


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
  // INIT
  // =========================================================
  isEditing=signal(false)
  ngOnInit(): void {
console.log(this.data)
this.isEditing.set(this.data?.add)
    if (
      !this.isEditing() &&
      this.data?.slider
    ) {

      this.sliderForm.patchValue({

      });
var image=environment.imageBaseUrl+this.data.slider.imageUrl
      this.imagePreview.set(
      image  ?? null
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
      this.sliderForm.invalid ||
      this.isSubmitting()
    ) {

      this.sliderForm.markAllAsTouched();

      return;

    }


    this.errorMessage.set(null);

    this.isSubmitting.set(true);


    try {

      const formData =
        new FormData();

    
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
        !this.isEditing() &&
        this.data?.slider
      ) {

        const sliderId =
          this.data.slider.id;


        formData.append(
          'Id',
          sliderId.toString()
        );


        const response =
          await firstValueFrom(

            this.sliderService.updateSlider(
              sliderId,
              formData
            )

          );
console.log(response)

        if (!response) {

          throw new Error(
            'Slider update failed.'
          );

        }

      }


      // =====================================================
      // CREATE
      // =====================================================

      else {

        const response =
          await firstValueFrom(

            this.sliderService.addSlider(
              formData
            )

          );
console.log(response)

        if (!response) {

          throw new Error(
            'Slider creation failed.'
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
        'Error saving image:',
        error
      );


      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving the image.'
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