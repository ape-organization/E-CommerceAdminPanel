import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CategoryService } from '../../../../services/category.service';

import { Category } from '../../../../models/category.model';

import { SharedModule } from '../../../../shared/shared.module';

import { AddCategoryComponent } from '../add-category/add-category.component';

import { MatTableDataSource } from '@angular/material/table';

import { ConfirmDeleteComponent } from '../../../../shared/confirm-delete/confirm-delete.component';

import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../../environments/environment';


@Component({
  selector: 'app-category-management',

  standalone: true,

  imports: [
    SharedModule
  ],

  templateUrl:
    './category-management.component.html',

  styleUrl:
    './category-management.component.scss'
})
export class CategoryManagementComponent
  implements OnInit {


  /* =========================================
     SERVICES
     ========================================= */

  private categoryService =
    inject(CategoryService);


  /* =========================================
     DATA
     ========================================= */

  categories =
    signal<Category[]>([]);


  dataSource =
    new MatTableDataSource<Category>();


  displayedColumns: string[] = [
    'name',
    'description',
    'actions'
  ];


  /* =========================================
     CATEGORY STATE
     ========================================= */

  categoryToEdit:
    Category | null = null;


  /* =========================================
     CONSTRUCTOR
     ========================================= */

  constructor(
    private dialog: MatDialog
  ) {}


  /* =========================================
     INIT
     ========================================= */

  ngOnInit(): void {

    this.loadCategories();

  }


  /* =========================================
     LOAD CATEGORIES
     ========================================= */

  loadCategories(): void {

    this.categoryService
      .getCategories()
      .subscribe({

        next: (cats: Category[]) => {

          /*
           * Update signal
           */

          this.categories.set(cats);


          /*
           * Update table
           */

          this.dataSource.data = cats;

        },

        error: (error) => {

          console.error(
            'Error loading categories:',
            error
          );

        }

      });

  }


  /* =========================================
     ADD CATEGORY
     ========================================= */

  showAddCategory(): void {

    /*
     * Clear edit state
     */

    this.categoryToEdit = null;


    /*
     * Open dialog
     */

    this.dialog
      .open(
        AddCategoryComponent,
        {

          width: '500px',

          maxWidth: '95vw',

          disableClose: true,

          data: {

            category: null,

            add: true,

            categories:
              this.categories()

          }

        }
      )
      .afterClosed()
      .subscribe((res: any) => {

        /*
         * Dialog returns:
         *
         * { status: true }
         *
         * when category was successfully
         * created.
         */

        if (!res || !res.status) {

          return;

        }


        /*
         * Reload categories
         */

        this.loadCategories();


        /*
         * Clear state
         */

        this.closeAddCategory();

      });

  }


  /* =========================================
     EDIT CATEGORY
     ========================================= */

  editCategory(
    category: Category
  ): void {

    /*
     * Save category being edited
     */

    this.categoryToEdit = category;


    /*
     * Open dialog
     */

    this.dialog
      .open(
        AddCategoryComponent,
        {

          width: '500px',

          maxWidth: '95vw',

          disableClose: true,

          data: {

            category:
              this.categoryToEdit,

            add: false,

            categories:
              this.categories()

          }

        }
      )
      .afterClosed()
      .subscribe((res: any) => {

        /*
         * Successful update
         */

        if (!res || !res.status) {

          return;

        }


        /*
         * Reload table
         */

        this.loadCategories();


        /*
         * Clear edit state
         */

        this.closeAddCategory();

      });

  }


  /* =========================================
     DELETE CATEGORY
     ========================================= */

  deleteCategory(
    id: number
  ): void {

    this.dialog
      .open(
        ConfirmDeleteComponent,
        {

          data:
            'Are you sure you want to delete this category?'

        }
      )
      .afterClosed()
      .subscribe((res: any) => {

        /*
         * User cancelled
         */

        if (!res || !res.status) {

          return;

        }


        /*
         * Delete category
         */

        this.categoryService
          .deleteCategory(id)
          .subscribe({

            next: () => {

              /*
               * Reload categories
               */

              this.loadCategories();

            },

            error: (error) => {

              console.error(
                'Error deleting category:',
                error
              );

            }

          });

      });

  }


  /* =========================================
     CLOSE
     ========================================= */

  closeAddCategory(): void {

    this.categoryToEdit = null;

  }
 // ==========================================================
  // IMAGE URL
  // ==========================================================

  getImageUrl(
    imageUrl?: string | null
  ): string {

    if (!imageUrl) {

      return 'assets/images/product-placeholder.png';

    }


    if (

      imageUrl.startsWith(
        'http://'
      ) ||

      imageUrl.startsWith(
        'https://'
      )

    ) {

      return imageUrl;

    }

    return environment.imageBaseUrl+imageUrl;

  }
}