
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
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Category } from '../../../../models/category.model';
import { SubCategory } from '../../../../models/subCategory.model';

import { TranslatePipe } from '@ngx-translate/core';


// ============================================================
// DIALOG DATA
// ============================================================

export interface AddSubCategoryDialogData {

  isEditing: boolean;

  categories: Category[];

  subcategory: SubCategory | null;

}


// ============================================================
// COMPONENT
// ============================================================

@Component({
  selector: 'app-add-sub-category',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatDialogModule,
    MatButtonModule,
    MatIconModule,

    TranslatePipe
  ],

  templateUrl: './add-sub-category.html',

  styleUrl: './add-sub-category.scss'
})
export class AddSubCategory implements OnInit {


  // ==========================================================
  // SERVICES
  // ==========================================================

  private readonly fb =
    inject(FormBuilder);

  private readonly dialogRef =
    inject(MatDialogRef<AddSubCategory>);


  // ==========================================================
  // STATE
  // ==========================================================

  readonly saving =
    signal(false);


  /*
   * This is a normal boolean.
   *
   * Do NOT make this a signal because the value
   * comes directly from the dialog data.
   */

  readonly isEditing: boolean;


  // ==========================================================
  // FORM
  // ==========================================================

  readonly form =
    this.fb.group({

      categoryId: [
        null as number | null,
        Validators.required
      ],

      nameAr: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100)
        ]
      ],

      nameEn: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100)
        ]
      ]

    });


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor(

    @Inject(MAT_DIALOG_DATA)

    public readonly data:
      AddSubCategoryDialogData

  ) {

    this.isEditing =
      data?.isEditing ?? false;

  }


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    const subcategory =
      this.data?.subcategory;


    /*
     * ADD MODE
     */

    if (!subcategory) {
      return;
    }


    /*
     * EDIT MODE
     */

    this.form.patchValue({

      categoryId:
        subcategory.categoryId ?? null,

      nameAr:
        subcategory.nameAr ?? '',

      nameEn:
        subcategory.nameEn ?? ''

    });

  }


  // ==========================================================
  // SAVE
  // ==========================================================

  save(): void {

    /*
     * Prevent duplicate submission
     */

    if (this.saving()) {
      return;
    }


    /*
     * Validate form
     */

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }


    /*
     * Start saving
     */

    this.saving.set(true);


    /*
     * Get form values
     */

    const value =
      this.form.getRawValue();


    /*
     * Build payload
     */

    const payload = {

      categoryId:
        Number(value.categoryId),

      nameAr:
        value.nameAr?.trim() ?? '',

      nameEn:
        value.nameEn?.trim() ?? ''

    };


    /*
     * Return data to parent
     */

    this.dialogRef.close({

      status: true,

      data: payload

    });

  }


  // ==========================================================
  // CANCEL
  // ==========================================================

  cancel(): void {

    if (this.saving()) {
      return;
    }


    this.dialogRef.close({

      status: false

    });

  }

}
