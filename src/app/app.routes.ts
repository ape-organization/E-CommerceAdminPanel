import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';
import { BaseLayout } from './components/base-layout/base-layout';

/*
 * Login and the layout shell load with the app.
 * Every admin page is lazy-loaded (its own chunk), so it is only
 * downloaded the first time that page is opened.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: BaseLayout,
    canActivate: [authGuard],
    data: { role: 'admin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/admin/dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'slider',
        loadComponent: () =>
          import('./components/admin/slider/slider-management/slider-management.component')
            .then(m => m.SliderManagementComponent)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./components/admin/product/product-management/product-management.component')
            .then(m => m.ProductManagementComponent)
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./components/admin/category/category-management/category-management.component')
            .then(m => m.CategoryManagementComponent)
      },
      {
        path: 'brand',
        loadComponent: () =>
          import('./components/admin/brand/brand-management/brand-management')
            .then(m => m.BrandManagement)
      },
      {
        path: 'subCategories',
        loadComponent: () =>
          import('./components/admin/subCategory/all-sub-category/all-sub-category')
            .then(m => m.AllSubCategory)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./components/admin/user/user-management/user-management.component')
            .then(m => m.UserManagementComponent)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./components/orders/orders')
            .then(m => m.Orders)
      }
    ]
  }
];
