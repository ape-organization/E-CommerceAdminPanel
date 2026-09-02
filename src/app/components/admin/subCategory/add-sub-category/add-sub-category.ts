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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

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
    TranslatePipe,
    CommonModule,
    ReactiveFormsModule,

    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
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
  // SIGNALS
  // ==========================================================

  readonly saving =
    signal(false);

  // ==========================================================
  // FORM
  // ==========================================================

  readonly form =
    this.fb.group({

      categoryId: [
        null as number | null,
        Validators.required
      ],

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
      ],

    });


  // ==========================================================
  // CONSTRUCTOR DATA
  // ==========================================================

  constructor(

    @Inject(MAT_DIALOG_DATA)

    public readonly data:
      AddSubCategoryDialogData

  ) {}


  // ==========================================================
  // COMPUTED-STYLE GETTERS
  // ==========================================================

   isEditing=signal(false)
     
  
  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {
this.isEditing.set(this.data?.isEditing)
    const subcategory =
      this.data?.subcategory;


    if (!subcategory) {
      return;
    }


    // ========================================================
    // EDIT MODE
    // ========================================================

    this.form.patchValue({

      categoryId:
        subcategory.categoryId ?? null,

      nameEn:
        subcategory.nameEn ?? '',
nameAr:
        subcategory.nameAr ?? '',
     

    });

  }


  // ==========================================================
  // SAVE
  // ==========================================================

  save(): void {

    // --------------------------------------------------------
    // PREVENT DUPLICATE SUBMISSION
    // --------------------------------------------------------

    if (this.saving()) {
      return;
    }


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }


    // --------------------------------------------------------
    // START SAVING
    // --------------------------------------------------------

    this.saving.set(true);


    // --------------------------------------------------------
    // FORM VALUE
    // --------------------------------------------------------

    const value =
      this.form.getRawValue();


    // --------------------------------------------------------
    // PAYLOAD
    // --------------------------------------------------------

    const payload = {

      categoryId:
        Number(value.categoryId),

      nameEn:
        value.nameEn?.trim() ?? '',
 nameAr:
        value.nameAr?.trim() ?? '',
     

    };


    // --------------------------------------------------------
    // RETURN TO PARENT
    // --------------------------------------------------------

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