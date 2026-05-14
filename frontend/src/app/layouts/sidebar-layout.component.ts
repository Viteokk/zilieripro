import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../shared/auth/auth.store';
import { I18nService, Lang } from '../shared/i18n/i18n.service';
import { TranslatePipe } from '../shared/i18n/translate.pipe';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar-layout',
  standalone: true,
  imports: [NgTemplateOutlet, RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Header (OWA-style: white, fixed, shadow) -->
    <header class="fixed top-0 left-0 right-0 h-[72px] bg-white z-[1000] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-between px-6 print:hidden">
      <div class="flex items-center gap-3">
        <!-- Hamburger (mobile) -->
        <button
          class="lg:hidden p-2 rounded-md hover:bg-accent transition-all"
          (click)="toggleSidebar()"
          aria-label="Toggle menu"
        >
          <svg class="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            @if (sidebarOpen()) {
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            } @else {
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
        <!-- Logo -->
        <span class="text-xl font-bold text-primary tracking-tight">eZilier</span>
        <span class="text-xs text-muted-foreground font-medium hidden sm:inline border-l border-border pl-3 ml-1">SIVZ</span>
      </div>

      <div class="flex items-center gap-4">
        <!-- Company switcher (Angajator only) -->
        @if (auth.roleType() === 'Angajator' && auth.user()?.beneficiaryName) {
          <button
            type="button"
            (click)="openCompanyPicker()"
            class="hidden sm:inline-flex h-8 items-center gap-2 rounded-md bg-secondary text-secondary-foreground px-3 text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5 shrink-0"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="16"/><line x1="15" y1="22" x2="15" y2="16"/></svg>
            <span class="max-w-[180px] truncate">{{ auth.user()?.beneficiaryName }}</span>
            @if (auth.availableCompanies().length > 1) {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3 shrink-0"><polyline points="6 9 12 15 18 9"/></svg>
            }
          </button>
        }
        <!-- User info -->
        <div class="hidden sm:flex items-center gap-3">
          <span class="text-sm text-foreground font-medium">{{ auth.fullName() }}</span>
          @if (auth.roleType(); as role) {
            <span class="inline-flex h-5 w-fit shrink-0 items-center justify-center overflow-hidden rounded-4xl px-2 py-0.5 text-xs font-medium"
                  [class]="roleBadgeClass(role)">
              {{ role }}
            </span>
          }
        </div>
        <!-- Language switcher -->
        <div class="inline-flex items-center rounded-md border border-input overflow-hidden text-xs font-medium">
          @for (l of langs; track l) {
            <button type="button" (click)="setLang(l)"
              [class]="(i18n.lang() === l ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent hover:text-accent-foreground') + ' h-8 px-2.5 transition-colors'">
              {{ l.toUpperCase() }}
            </button>
          }
        </div>
        <!-- Logout -->
        <button
          class="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
          (click)="logout()"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {{ 'action.logout' | t }}
        </button>
      </div>
    </header>

    <!-- Sidebar backdrop (mobile) -->
    @if (sidebarOpen()) {
      <div
        class="fixed inset-0 bg-black/40 z-30 lg:hidden"
        (click)="closeSidebar()"
      ></div>
    }

    <!-- Sidebar -->
    <aside
      class="fixed top-[72px] left-0 bottom-0 w-60 bg-card border-r border-border z-40 overflow-y-auto transition-transform duration-200 print:hidden"
      [class.max-lg:-translate-x-full]="!sidebarOpen()"
      [class.max-lg:translate-x-0]="sidebarOpen()"
    >
      <nav class="flex flex-col gap-1 overflow-auto py-6 px-3">
        @switch (auth.roleType()) {
          @case ('Angajator') {
            @for (item of employerNav; track item.route) {
              <ng-container *ngTemplateOutlet="navLink; context: { $implicit: item }" />
            }
          }
          @case ('Inspector') {
            @for (item of inspectorNav; track item.route) {
              <ng-container *ngTemplateOutlet="navLink; context: { $implicit: item }" />
            }
          }
          @case ('Administrator') {
            @for (item of adminNav; track item.route) {
              <ng-container *ngTemplateOutlet="navLink; context: { $implicit: item }" />
            }
          }
          @case ('Zilier') {
            @for (item of zilierNav; track item.route) {
              <ng-container *ngTemplateOutlet="navLink; context: { $implicit: item }" />
            }
          }
        }
      </nav>

      <ng-template #navLink let-item>
        <a
          [routerLink]="item.route"
          routerLinkActive="bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
          [routerLinkActiveOptions]="{ exact: item.route === '/vouchers' }"
          class="inline-flex items-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full justify-start gap-3"
          (click)="closeSidebar()"
        >
          <span class="text-base leading-none">{{ item.icon }}</span>
          <span>{{ item.label | t }}</span>
        </a>
      </ng-template>
    </aside>

    <!-- Main content -->
    <main class="mt-[72px] lg:ml-60 min-h-[calc(100vh-72px)] bg-white print:m-0 print:min-h-0">
      <div class="px-2 sm:px-4 md:px-6 py-8 print:p-0">
        <router-outlet />
      </div>
    </main>
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class SidebarLayoutComponent {
  readonly auth = inject(AuthStore);
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  readonly sidebarOpen = signal(false);

  readonly langs: Lang[] = ['ro', 'ru', 'en'];
  setLang(l: Lang): void { this.i18n.setLang(l); }

  readonly employerNav: NavItem[] = [
    { label: 'nav.vouchers', route: '/vouchers', icon: '\u{1F4CB}' },
    { label: 'nav.workers', route: '/workers', icon: '\u{1F465}' },
    { label: 'nav.ipc21', route: '/reports/ipc21', icon: '\u{1F4C4}' },
    { label: 'nav.company', route: '/company', icon: '\u{1F3E2}' },
  ];

  readonly inspectorNav: NavItem[] = [
    { label: 'nav.vouchers', route: '/vouchers', icon: '\u{1F4CB}' },
  ];

  readonly adminNav: NavItem[] = [
    { label: 'nav.users', route: '/admin/users', icon: '\u{1F464}' },
    { label: 'nav.companies', route: '/admin/companies', icon: '\u{1F3E2}' },
    { label: 'nav.params', route: '/admin/params', icon: '\u{2699}\u{FE0F}' },
    { label: 'nav.nomenclators', route: '/admin/nomenclators', icon: '\u{1F4D6}' },
    { label: 'nav.audit', route: '/admin/audit', icon: '\u{1F50D}' },
  ];

  readonly zilierNav: NavItem[] = [
    { label: 'nav.myVouchers', route: '/my-vouchers', icon: '\u{1F4CB}' },
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  openCompanyPicker(): void {
    if (this.auth.availableCompanies().length > 1) {
      this.router.navigate(['/select-company']);
    }
  }

  roleBadgeClass(role: string): string {
    switch (role) {
      case 'Angajator': return 'bg-primary/10 text-primary border border-primary/20';
      case 'Inspector': return 'bg-warning/15 text-warning-foreground border border-warning/30';
      case 'Administrator': return 'bg-destructive/10 text-destructive border border-destructive/20';
      case 'Zilier': return 'bg-success/10 text-success border border-success/20';
      default: return 'bg-muted text-muted-foreground';
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
