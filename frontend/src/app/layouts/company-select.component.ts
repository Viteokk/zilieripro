import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthStore } from '../shared/auth/auth.store';
import { CompanyInfo } from '../shared/models/voucher.model';

@Component({
  selector: 'app-company-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-white flex items-center justify-center p-4">
      <div class="w-full max-w-3xl bg-card text-card-foreground ring-1 ring-foreground/10 rounded-xl shadow-xs overflow-hidden">

        <!-- Header -->
        <div class="px-6 py-5 bg-muted/30 border-b border-foreground/10">
          <h1 class="text-2xl font-bold tracking-tight text-foreground">Selectare companie</h1>
          @if (auth.user(); as u) {
            <p class="text-sm text-muted-foreground mt-1">
              Autentificat ca: <strong class="text-foreground">{{ u.lastName }} {{ u.firstName }}</strong>
              <span class="text-muted-foreground"> (IDNP: <span class="font-mono">{{ u.idnp }}</span>)</span>
            </p>
          }
        </div>

        <div class="p-6">
          @if (companies().length === 0) {
            <div class="text-center py-12">
              <p class="text-muted-foreground mb-4">Nicio companie disponibila pentru contul dvs.</p>
              <button type="button" (click)="logout()"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
                Inapoi la login
              </button>
            </div>
          } @else {
            <p class="text-sm text-muted-foreground mb-4">
              Selectati compania pentru care doriti sa accesati eZilier:
            </p>

            <div class="space-y-2 mb-6">
              @for (c of companies(); track c.beneficiaryId) {
                <label
                  [class]="'block rounded-lg ring-1 px-4 py-3 transition-colors cursor-pointer ' +
                    (selectedId() === c.beneficiaryId
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'ring-foreground/10 hover:bg-accent/40')">
                  <div class="flex items-start gap-3">
                    <input type="radio" name="company"
                      [value]="c.beneficiaryId"
                      [checked]="selectedId() === c.beneficiaryId"
                      (change)="selectedId.set(c.beneficiaryId)"
                      class="mt-1 size-4 accent-primary" />
                    <div class="flex-1 min-w-0">
                      <span class="font-semibold text-foreground">{{ c.companyName }}</span>
                      <div class="mt-0.5 text-xs text-muted-foreground">
                        IDNO: <span class="font-mono text-foreground">{{ c.idno }}</span>
                      </div>
                    </div>
                  </div>
                </label>
              }
            </div>

            <div class="flex items-center justify-between gap-3">
              <button type="button" (click)="logout()"
                class="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
                Inapoi la login
              </button>
              <button type="button" (click)="confirm()" [disabled]="!selectedId() || switching()"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                @if (switching()) {
                  Se incarca...
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  Continua cu compania selectata
                }
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class CompanySelectComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly companies = computed<CompanyInfo[]>(() => this.auth.availableCompanies());
  protected readonly selectedId = signal<string | null>(this.auth.user()?.beneficiaryId ?? null);
  protected readonly switching = signal(false);

  protected async confirm(): Promise<void> {
    const id = this.selectedId();
    if (!id) return;
    this.switching.set(true);
    try {
      await this.auth.switchCompany(id);
      window.location.href = '/vouchers';
    } finally {
      this.switching.set(false);
    }
  }

  protected logout(): void {
    this.auth.logout();
  }
}
