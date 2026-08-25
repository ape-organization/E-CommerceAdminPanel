import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CategoryService } from '../../../../services/category.service';
import { SubCategoryService } from '../../../../services/sub-category.service';

import { AddSubCategory } from '../add-sub-category/add-sub-category';

import { ConfirmDeleteComponent } from '../../../../shared/confirm-delete/confirm-delete.component';

import { Category } from '../../../../models/category.model';
import { SubCategory } from '../../../../models/subCategory.model';

@Component({
  selector: 'app-all-sub-category',
  standalone: true,
  imports: [
    CommonModule,

    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule
  ],
  templateUrl: './all-sub-category.html',
  styleUrl: './all-sub-category.scss'
})
export class AllSubCategory implements OnInit {

  private readonly dialog = inject(MatDialog);
  private readonly categoryService = inject(CategoryService);
  private readonly subCategoryService = inject(SubCategoryService);
private readonly cdr = inject(ChangeDetectorRef);

  // =========================================================
  // TABLE
  // =========================================================

  displayedColumns: string[] = [
    'name',
    'category',
    'description',
    'actions'
  ];

  dataSource = new MatTableDataSource<SubCategory>([]);


  // =========================================================
  // DATA
  // =========================================================

  categories: Category[] = [];

  subcategories: SubCategory[] = [];

  loading = false;

  errorMessage: string | null = null;


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.loadCategories();

    this.loadSubcategories();

  }


  // =========================================================
  // LOAD CATEGORIES
  // =========================================================

  loadCategories(): void {

    this.categoryService.getCategories()
      .subscribe({

        next: (categories) => {
          this.categories = categories;
 // Tell Angular that the async data has changed
        this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Error loading categories:',
            error
          );

          this.errorMessage =
            'Failed to load categories.';
 // Tell Angular that the async data has changed
        this.cdr.detectChanges();
        }

      });

  }


  // =========================================================
  // LOAD SUBCATEGORIES
  // =========================================================

  loadSubcategories(): void {

    this.loading = true;

    this.errorMessage = null;

    this.subCategoryService.getAll()
      .subscribe({

        next: (subcategories) => {

          this.subcategories = subcategories;

          this.dataSource.data = subcategories;

          this.loading = false;

        },

        error: (error) => {

          console.error(
            'Error loading subcategories:',
            error
          );

          this.errorMessage =
            'Failed to load subcategories.';

          this.loading = false;

        }

      });

  }


  // =========================================================
  // ADD SUBCATEGORY
  // =========================================================

  showAddSubcategory(): void {

    const dialogRef = this.dialog.open(
      AddSubCategory,
      {
        width: '500px',
        maxWidth: '95vw',

        data: {
          categories: this.categories,

          subcategory: null,

          isEditing: false
        }
      }
    );


    dialogRef.afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.createSubcategory(result);

      });

  }


  // =========================================================
  // CREATE
  // POST
  // api/SubCategory
  // =========================================================

  createSubcategory(info: any): void {
console.log(info)
    const request = {
      categoryId:info. data.categoryId,
      name:info. data.name,
      description:info. data.description
    };
console.log(request)

    this.subCategoryService
      .create(request)
      .subscribe({

        next: () => {

          // Reload from database
          this.loadSubcategories();

        },

        error: (error) => {

          console.error(
            'Error creating subcategory:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'Failed to create subcategory.';

        }

      });

  }


  // =========================================================
  // EDIT SUBCATEGORY
  // =========================================================

  editSubcategory(
    subcategory: SubCategory
  ): void {

    const dialogRef = this.dialog.open(
      AddSubCategory,
      {
        width: '500px',
        maxWidth: '95vw',

        data: {

          categories: this.categories,

          subcategory: subcategory,

          isEditing: true

        }
      }
    );


    dialogRef.afterClosed()
      .subscribe((result) => {

        if (!result) {
          return;
        }

        this.updateSubcategory(
          subcategory.id,
          result
        );

      });

  }


  // =========================================================
  // UPDATE
  // PUT
  // api/SubCategory/{id}
  // =========================================================

  updateSubcategory(
    id: number,
    info: any
  ): void {

    const request = {
      categoryId:info. data.categoryId,
      name:info. data.name,
      description:info. data.description
    };


    this.subCategoryService
      .update(id, request)
      .subscribe({

        next: () => {

          // Reload from database
          this.loadSubcategories();

        },

        error: (error) => {

          console.error(
            'Error updating subcategory:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'Failed to update subcategory.';

        }

      });

  }


  // =========================================================
  // DELETE
  // DELETE
  // api/SubCategory/{id}
  // =========================================================

  deleteSubcategory(
    id: number
  ): void {

    const dialogRef =
      this.dialog.open(
        ConfirmDeleteComponent,
        {
          data:
            'Are you sure you want to delete this subcategory?'
        }
      );


    dialogRef.afterClosed()
      .subscribe((result: any) => {

        if (!result?.status) {
          return;
        }


        this.subCategoryService
          .delete(id)
          .subscribe({

            next: () => {

              // Reload from database
              this.loadSubcategories();

            },

            error: (error) => {

              console.error(
                'Error deleting subcategory:',
                error
              );

              this.errorMessage =
                error?.error?.message ??
                'Failed to delete subcategory.';

            }

          });

      });

  }


  // =========================================================
  // CATEGORY NAME
  // =========================================================

  getCategoryName(
    categoryId: number
  ): string {

    return (
      this.categories.find(
        category =>
          category.id === categoryId
      )?.name ?? 'Unknown'
    );

  }

}