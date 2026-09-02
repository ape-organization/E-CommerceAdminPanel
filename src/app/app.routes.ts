import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin/dashboard/admin-dashboard.component';
import { ProductManagementComponent } from './components/admin/product/product-management/product-management.component';
import { CategoryManagementComponent } from './components/admin/category/category-management/category-management.component';
import { UserManagementComponent } from './components/admin/user/user-management/user-management.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';
import { BaseLayout } from './components/base-layout/base-layout';
import { AllSubCategory } from './components/admin/subCategory/all-sub-category/all-sub-category';
import { Orders } from './components/orders/orders';
import { BrandManagement } from './components/admin/brand/brand-management/brand-management';
import { SliderManagementComponent } from './components/admin/slider/slider-management/slider-management.component';

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
            { path: 'dashboard', component: AdminDashboardComponent },
 { path: 'slider', component: SliderManagementComponent },
      { path: 'products', component: ProductManagementComponent },
      { path: 'categories', component: CategoryManagementComponent },
            { path: 'brand', component: BrandManagement },

       { path: 'subCategories', component: AllSubCategory },
      { path: 'users', component: UserManagementComponent },
      { path: 'orders', component: Orders }
    ]
  }
];
