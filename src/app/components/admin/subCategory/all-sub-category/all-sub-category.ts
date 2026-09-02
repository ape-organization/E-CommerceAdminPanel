import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';

import { CategoryService } from '../../../../services/category.service';
import { SubCategoryService } from '../../../../services/sub-category.service';

import { AddSubCategory } from '../add-sub-category/add-sub-category';

import { ConfirmDeleteComponent } from '../../../../shared/confirm-delete/confirm-delete.component';

import { Category } from '../../../../models/category.model';
import { SubCategory } from '../../../../models/subCategory.model';
import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-all-sub-category',
  standalone: true,

  imports: [
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatTableModule,
    TranslatePipe
  ],

  templateUrl: './all-sub-category.html',

  styleUrl: './all-sub-category.scss'
})
export class AllSubCategory implements OnInit {

  // ==========================================================
  // SERVICES
  // ==========================================================

  private readonly dialog =
    inject(MatDialog);

  private readonly categoryService =
    inject(CategoryService);

  private readonly subCategoryService =
    inject(SubCategoryService);


  // ==========================================================
  // DATA
  // ==========================================================

  readonly categories =
    signal<Category[]>([]);

  readonly subcategories =
    signal<SubCategory[]>([]);


  // ==========================================================
  // PAGINATION
  // ==========================================================

  readonly pageIndex =
    signal(0);

  readonly pageSize =
    signal(10);


  readonly paginatedSubcategories =
    computed(() => {

      const subcategories =
        this.subcategories();

      const start =
        this.pageIndex() * this.pageSize();

      return subcategories.slice(
        start,
        start + this.pageSize()
      );

    });


  // ==========================================================
  // ERROR
  // ==========================================================

  readonly errorMessage =
    signal<string | null>(null);


  // ==========================================================
  // TABLE
  // ==========================================================

  readonly displayedColumns = [
    'name',
    'category',
   
    'actions'
  ];


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.loadCategories();

    this.loadSubcategories();

  }


  // ==========================================================
  // LOAD CATEGORIES
  // ==========================================================

  loadCategories(): void {

    this.categoryService
      .getCategories()
      .subscribe({

        next: categories => {
console.log(categories)
          this.categories.set(
            Array.isArray(categories)
              ? categories
              : []
          );

        },

        error: error => {

          console.error(
            'Error loading categories:',
            error
          );

        }

      });

  }


  // ==========================================================
  // LOAD SUBCATEGORIES
  // ==========================================================

  loadSubcategories(): void {

    this.subCategoryService
      .getAll()
      .subscribe({

        next: subcategories => {

          this.subcategories.set(
            Array.isArray(subcategories)
              ? subcategories
              : []
          );

          this.pageIndex.set(0);

        },

        error: error => {

          console.error(
            'Error loading subcategories:',
            error
          );

          this.subcategories.set([]);

          this.errorMessage.set(
            error?.error?.message ??
            'Failed to load subcategories.'
          );

        }

      });

  }


  // ==========================================================
  // PAGINATION
  // ==========================================================

  onPageChange(event: PageEvent): void {

    this.pageIndex.set(
      event.pageIndex
    );

    this.pageSize.set(
      event.pageSize
    );

  }


  // ==========================================================
  // ADD
  // ==========================================================

  showAddSubcategory(): void {

    this.openSubcategoryDialog(
      true
    );

  }


  // ==========================================================
  // EDIT
  // ==========================================================

  editSubcategory(
    subcategory: SubCategory
  ): void {

    this.openSubcategoryDialog(
      false,
      subcategory
    );

  }


  // ==========================================================
  // DIALOG
  // ==========================================================

  private openSubcategoryDialog(
    add: boolean,
    subcategory: SubCategory | null = null
  ): void {

    this.dialog
      .open(
        AddSubCategory,
        {

          width: '500px',

          maxWidth: '95vw',

          disableClose: true,

          data: {

            subcategory,

            isEditing: !add,

            categories:
              this.categories()

          }

        }
      )
      .afterClosed()
      .subscribe(result => {

        if (!result?.status) {
          return;
        }


        if (add) {

          this.createSubcategory(
            result.data
          );

        } else if (subcategory) {

          this.updateSubcategory(
            subcategory.id,
            result.data
          );

        }

      });

  }


  // ==========================================================
  // CREATE
  // ==========================================================

  createSubcategory(
    data: {
      categoryId: number;
      nameEn: string;
      nameAr:string
   
    }
  ): void {

    this.errorMessage.set(null);

    const request = {

      categoryId:
        data.categoryId,

      nameAr:
        data.nameAr,
        nameEn:data.nameEn

    };


    this.subCategoryService
      .create(request)
      .subscribe({

        next: () => {

          this.loadSubcategories();

        },

        error: error => {

          console.error(
            'Error creating subcategory:',
            error
          );

          this.errorMessage.set(
            error?.error?.message ??
            'Failed to create subcategory.'
          );

        }

      });

  }


  // ==========================================================
  // UPDATE
  // ==========================================================

  updateSubcategory(

    id: number,

    data: {
      categoryId: number;
      nameAr: string;
      nameEn:string;
    }

  ): void {

    this.errorMessage.set(null);

    const request = {

      categoryId:
        data.categoryId,

      nameAr:
        data.nameAr,
        nameEn:data.nameEn

    };


    this.subCategoryService
      .update(id, request)
      .subscribe({

        next: () => {

          this.loadSubcategories();

        },

        error: error => {

          console.error(
            'Error updating subcategory:',
            error
          );

          this.errorMessage.set(
            error?.error?.message ??
            'Failed to update subcategory.'
          );

        }

      });

  }


  // ==========================================================
  // DELETE
  // ==========================================================

  deleteSubcategory(
    id: number
  ): void {

    this.dialog
      .open(
        ConfirmDeleteComponent,
        {
          data:
            'Are you sure you want to delete this subcategory?'
        }
      )
      .afterClosed()
      .subscribe(result => {

        if (!result?.status) {
          return;
        }


        this.subCategoryService
          .delete(id)
          .subscribe({

            next: () => {

              this.subcategories.update(
                subcategories =>
                  subcategories.filter(
                    subcategory =>
                      subcategory.id !== id
                  )
              );

              this.fixPageAfterDelete();

            },

            error: error => {

              console.error(
                'Error deleting subcategory:',
                error
              );

              this.errorMessage.set(
                error?.error?.message ??
                'Failed to delete subcategory.'
              );

            }

          });

      });

  }


  // ==========================================================
  // KEEP PAGINATION VALID AFTER DELETE
  // ==========================================================

  private fixPageAfterDelete(): void {

    const lastPage =
      Math.max(
        0,
        Math.ceil(
          this.subcategories().length /
          this.pageSize()
        ) - 1
      );


    this.pageIndex.set(
      Math.min(
        this.pageIndex(),
        lastPage
      )
    );

  }


  // ==========================================================
  // CATEGORY NAME
  // ==========================================================

  getCategoryName(
    categoryId: number
  ): string {

    return (
      this.categories().find(
        category =>
          category.id === categoryId
      )?.nameEn
      ?? 'Unknown'
    );

  }

}