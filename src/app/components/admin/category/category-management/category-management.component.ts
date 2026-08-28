import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MatDialog } from '@angular/material/dialog';

import { CategoryService } from '../../../../services/category.service';

import { Category } from '../../../../models/category.model';

import { SharedModule } from '../../../../shared/shared.module';

import { AddCategoryComponent } from '../add-category/add-category.component';

import { ConfirmDeleteComponent } from '../../../../shared/confirm-delete/confirm-delete.component';

import { environment } from '../../../../../environments/environment';


@Component({
  selector: 'app-category-management',
  standalone: true,

  imports: [
    SharedModule,
    MatPaginatorModule
  ],

  templateUrl: './category-management.component.html',

  styleUrl: './category-management.component.scss'
})
export class CategoryManagementComponent implements OnInit {

  private readonly categoryService =
    inject(CategoryService);

  private readonly dialog =
    inject(MatDialog);


  // ==========================================================
  // DATA
  // ==========================================================

  readonly categories =
    signal<Category[]>([]);


  // ==========================================================
  // PAGINATION
  // ==========================================================

  readonly pageIndex =
    signal(0);

  readonly pageSize =
    signal(10);


  readonly paginatedCategories = computed(() => {

    const categories = this.categories();

    const start =
      this.pageIndex() * this.pageSize();

    return categories.slice(
      start,
      start + this.pageSize()
    );

  });


  // ==========================================================
  // TABLE
  // ==========================================================

  readonly displayedColumns = [
    'name',
    'description',
    'actions'
  ];


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {
    this.loadCategories();
  }


  // ==========================================================
  // LOAD
  // ==========================================================

  loadCategories(): void {

    this.categoryService
      .getCategories()
      .subscribe({

        next: categories => {

          this.categories.set(
            Array.isArray(categories)
              ? categories
              : []
          );

          this.pageIndex.set(0);

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

  showAddCategory(): void {

    this.openCategoryDialog(
      true
    );
  }


  // ==========================================================
  // EDIT
  // ==========================================================

  editCategory(
    category: Category
  ): void {

    this.openCategoryDialog(
      false,
      category
    );
  }


  private openCategoryDialog(
    add: boolean,
    category: Category | null = null
  ): void {

    this.dialog
      .open(
        AddCategoryComponent,
        {

          width: '500px',

          maxWidth: '95vw',

          disableClose: true,

          data: {
            category,
            add,
            categories: this.categories()
          }

        }
      )
      .afterClosed()
      .subscribe(result => {

        if (result?.status) {
          this.loadCategories();
        }

      });
  }


  // ==========================================================
  // DELETE
  // ==========================================================

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
      .subscribe(result => {

        if (!result?.status) {
          return;
        }

        this.categoryService
          .deleteCategory(id)
          .subscribe({

            next: () => {

              this.categories.update(
                categories =>
                  categories.filter(
                    category =>
                      category.id !== id
                  )
              );

              this.fixPageAfterDelete();

            },

            error: error => {

              console.error(
                'Error deleting category:',
                error
              );

            }

          });

      });
  }


  // ==========================================================
  // KEEP PAGINATION VALID AFTER DELETE
  // ==========================================================

  private fixPageAfterDelete(): void {

    const lastPage = Math.max(
      0,
      Math.ceil(
        this.categories().length /
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
  // IMAGE
  // ==========================================================

  getImageUrl(
    imageUrl?: string | null
  ): string {

    if (!imageUrl) {
      return 'assets/images/product-placeholder.png';
    }

    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://')
    ) {
      return imageUrl;
    }

    return `${environment.imageBaseUrl}${imageUrl}`;
  }

}