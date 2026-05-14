import { Routes } from '@angular/router';
import { authGuard } from './shared/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./layouts/login.component').then(m => m.LoginComponent) },
  {
    path: 'select-company',
    loadComponent: () => import('./layouts/company-select.component').then(m => m.CompanySelectComponent),
    canActivate: [authGuard],
  },
  {
    path: '',
    loadComponent: () => import('./layouts/sidebar-layout.component').then(m => m.SidebarLayoutComponent),
    canActivate: [authGuard],
    children: [
      // Employer / Inspector vouchers
      { path: 'vouchers', loadComponent: () => import('./domains/vouchers/feature/voucher-list.component').then(m => m.VoucherListComponent) },
      { path: 'vouchers/create', loadComponent: () => import('./domains/vouchers/feature/create-voucher.component').then(m => m.CreateVoucherComponent) },
      { path: 'vouchers/register', loadComponent: () => import('./domains/vouchers/feature/daily-register.component').then(m => m.DailyRegisterComponent) },
      { path: 'vouchers/print', loadComponent: () => import('./domains/vouchers/feature/voucher-bulk-print.component').then(m => m.VoucherBulkPrintComponent) },
      { path: 'vouchers/:id/receipt', loadComponent: () => import('./domains/vouchers/feature/voucher-receipt.component').then(m => m.VoucherReceiptComponent) },
      { path: 'vouchers/:id', loadComponent: () => import('./domains/vouchers/feature/voucher-detail.component').then(m => m.VoucherDetailComponent) },
      { path: 'vouchers/:id/edit', loadComponent: () => import('./domains/vouchers/feature/voucher-edit.component').then(m => m.VoucherEditComponent) },
      // Zilier portal
      { path: 'my-vouchers', loadComponent: () => import('./domains/vouchers/feature/zilier-portal.component').then(m => m.ZilierPortalComponent) },
      { path: 'my-vouchers/:id/receipt', loadComponent: () => import('./domains/vouchers/feature/voucher-receipt.component').then(m => m.VoucherReceiptComponent) },
      // Workers
      { path: 'workers', loadComponent: () => import('./domains/workers/feature/worker-list.component').then(m => m.WorkerListComponent) },
      { path: 'workers/:id', loadComponent: () => import('./domains/workers/feature/worker-profile.component').then(m => m.WorkerProfileComponent) },
      // Reports
      { path: 'reports', loadComponent: () => import('./domains/reports/feature/reports.component').then(m => m.ReportsComponent) },
      { path: 'reports/ipc21', loadComponent: () => import('./domains/reports/feature/ipc21-report.component').then(m => m.Ipc21ReportComponent) },
      // Company profile
      { path: 'company', loadComponent: () => import('./domains/user-management/feature/company-profile.component').then(m => m.CompanyProfileComponent) },
      // Admin
      { path: 'admin/users', loadComponent: () => import('./domains/user-management/feature/user-list.component').then(m => m.UserListComponent) },
      { path: 'admin/users/:id', loadComponent: () => import('./domains/user-management/feature/user-detail.component').then(m => m.UserDetailComponent) },
      { path: 'admin/params', loadComponent: () => import('./domains/user-management/feature/system-params.component').then(m => m.SystemParamsComponent) },
      { path: 'admin/nomenclators', loadComponent: () => import('./domains/user-management/feature/nomenclators.component').then(m => m.NomenclatorsComponent) },
      { path: 'admin/audit', loadComponent: () => import('./domains/user-management/feature/audit-log.component').then(m => m.AuditLogComponent) },
      { path: 'admin/companies', loadComponent: () => import('./domains/user-management/feature/company-management.component').then(m => m.CompanyManagementComponent) },
      // Default
      { path: '', redirectTo: 'vouchers', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
