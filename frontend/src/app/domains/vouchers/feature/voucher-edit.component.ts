import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VoucherDataService } from '../data/voucher-data.service';
import { VoucherDetail } from '../../../shared/models/voucher.model';
import { StatusBadgeComponent } from '../../../shared/ui/components/status-badge.component';

@Component({
  selector: 'app-voucher-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <a [routerLink]="['/vouchers', voucherId]" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">&larr; Inapoi la detalii</a>
        <h1 class="text-3xl font-bold tracking-tight text-foreground mt-2">Editare voucher</h1>
        @if (voucher()) {
          <div class="mt-1 flex items-center gap-2">
            <span class="text-sm text-muted-foreground font-mono">{{ voucher()!.code }}</span>
            <app-status-badge [status]="voucher()!.status" />
          </div>
        }
      </div>

      @if (voucher()) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Work details -->
          <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <h2 class="text-lg font-semibold text-foreground mb-4">Detalii munca</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Data lucrului</label>
                <input
                  type="date"
                  formControlName="workDate"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Ore lucrate</label>
                <input
                  type="number"
                  formControlName="hoursWorked"
                  min="1"
                  max="8"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Raion</label>
                <select
                  formControlName="workDistrict"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                >
                  <option value="">Selectati raionul</option>
                  <option value="Chisinau">Chisinau</option>
                  <option value="Balti">Balti</option>
                  <option value="Cahul">Cahul</option>
                  <option value="Orhei">Orhei</option>
                  <option value="Ungheni">Ungheni</option>
                  <option value="Soroca">Soroca</option>
                  <option value="Edinet">Edinet</option>
                  <option value="Comrat">Comrat</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Localitate</label>
                <input
                  type="text"
                  formControlName="workLocality"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                />
              </div>
              <div class="md:col-span-2 space-y-2">
                <label class="text-sm font-medium leading-none select-none">Adresa</label>
                <input
                  type="text"
                  formControlName="workAddress"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                />
              </div>
            </div>
            <div class="mt-4 flex items-center gap-6">
              <label class="flex items-center gap-2 text-sm text-foreground/80">
                <input type="checkbox" formControlName="art5Alin1LitB" class="rounded border-input text-primary focus:ring-ring/50" />
                Art. 5, alin. (1), lit. b)
              </label>
              <label class="flex items-center gap-2 text-sm text-foreground/80">
                <input type="checkbox" formControlName="art5Alin1LitG" class="rounded border-input text-primary focus:ring-ring/50" />
                Art. 5, alin. (1), lit. g)
              </label>
            </div>
          </div>

          <!-- Worker info (read-only for ACTIV) -->
          <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <h2 class="text-lg font-semibold text-foreground mb-4">Informatii lucrator</h2>
            @if (voucher()!.status === 'Activ') {
              <p class="text-xs text-warning-foreground mb-3">Campurile lucratorului sunt blocate deoarece voucherul este activ (RSP validat).</p>
            }
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">IDNP</label>
                <input
                  type="text"
                  [value]="voucher()!.worker.idnp"
                  disabled
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none disabled:pointer-events-none disabled:opacity-50"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Prenume</label>
                <input
                  type="text"
                  [value]="voucher()!.worker.firstName"
                  disabled
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none disabled:pointer-events-none disabled:opacity-50"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Nume</label>
                <input
                  type="text"
                  [value]="voucher()!.worker.lastName"
                  disabled
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none disabled:pointer-events-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <!-- Contact lucrator -->
          <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <h2 class="text-lg font-semibold text-foreground mb-4">Contact lucrator</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Telefon</label>
                <input
                  type="tel"
                  formControlName="phone"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Email</label>
                <input
                  type="email"
                  formControlName="email"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <!-- Financial -->
          <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
            <h2 class="text-lg font-semibold text-foreground mb-4">Remunerare</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Remunerare neta (MDL)</label>
                <input
                  type="number"
                  formControlName="netRemuneration"
                  min="1"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
            </div>
            <!-- Tax recalculation -->
            <div class="mt-4 bg-muted rounded-md p-4">
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Net: <strong class="text-foreground">{{ taxCalc().net }} MDL</strong></span>
                <span>&rarr;</span>
                <span>+12% impozit: <strong class="text-foreground">{{ taxCalc().tax }} MDL</strong></span>
                <span>&rarr;</span>
                <span>+6% CNAS: <strong class="text-foreground">{{ taxCalc().cnas }} MDL</strong></span>
                <span>&rarr;</span>
                <span>Brut: <strong class="text-primary">{{ taxCalc().gross }} MDL</strong></span>
              </div>
            </div>
          </div>

          <!-- Error -->
          @if (errorMessage()) {
            <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive font-medium">
              <p>{{ errorMessage() }}</p>
            </div>
          }

          <!-- Submit -->
          <div class="flex justify-end gap-3">
            <a
              [routerLink]="['/vouchers', voucherId]"
              class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
            >
              Anuleaza
            </a>
            <button
              type="submit"
              [disabled]="submitting()"
              class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              @if (submitting()) {
                Se salveaza...
              } @else {
                Salveaza modificarile
              }
            </button>
          </div>
        </form>
      } @else if (loading()) {
        <div class="flex items-center justify-center py-12">
          <p class="text-muted-foreground">Se incarca...</p>
        </div>
      }
    </div>
  `,
})
export class VoucherEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly voucherDataService = inject(VoucherDataService);

  protected readonly voucher = signal<VoucherDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected voucherId = '';

  protected readonly form = this.fb.group({
    workDate: ['', Validators.required],
    hoursWorked: [8, [Validators.required, Validators.min(1), Validators.max(8)]],
    workDistrict: ['', Validators.required],
    workLocality: ['', Validators.required],
    workAddress: [''],
    art5Alin1LitB: [false],
    art5Alin1LitG: [false],
    netRemuneration: [0, [Validators.required, Validators.min(1)]],
    phone: [''],
    email: [''],
  });

  protected taxCalc = signal({ net: 0, tax: 0, cnas: 0, gross: 0 });

  constructor() {
    this.form.get('netRemuneration')!.valueChanges.subscribe((val) => {
      const net = Number(val) || 0;
      const tax = Math.round(net * 0.12 * 100) / 100;
      const cnas = Math.round(net * 0.06 * 100) / 100;
      this.taxCalc.set({ net, tax, cnas, gross: Math.round((net + tax + cnas) * 100) / 100 });
    });
  }

  ngOnInit(): void {
    this.voucherId = this.route.snapshot.paramMap.get('id')!;
    this.loadVoucher(this.voucherId);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Completati toate campurile obligatorii.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const value = this.form.getRawValue();
    const isActiv = this.voucher()!.status === 'Activ';

    const req: Record<string, unknown> = {
      hoursWorked: value.hoursWorked,
      netRemuneration: Number(value.netRemuneration),
      phone: value.phone || null,
      email: value.email || null,
    };

    if (!isActiv) {
      req['workDate'] = value.workDate;
      req['workDistrict'] = value.workDistrict;
      req['workLocality'] = value.workLocality;
      req['workAddress'] = value.workAddress || null;
      req['art5Alin1LitB'] = value.art5Alin1LitB ?? false;
      req['art5Alin1LitG'] = value.art5Alin1LitG ?? false;
    }

    this.voucherDataService.editVoucher(this.voucherId, req).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/vouchers', this.voucherId]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Eroare la salvarea modificarilor.');
      },
    });
  }

  private loadVoucher(id: string): void {
    this.loading.set(true);
    this.voucherDataService.getVoucher(id).subscribe({
      next: (v) => {
        this.voucher.set(v);
        this.loading.set(false);
        this.populateForm(v);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private populateForm(v: VoucherDetail): void {
    this.form.patchValue({
      workDate: v.workDate,
      hoursWorked: v.hoursWorked,
      workDistrict: v.workDistrict,
      workLocality: v.workLocality,
      workAddress: v.workAddress || '',
      art5Alin1LitB: v.art5Alin1LitB,
      art5Alin1LitG: v.art5Alin1LitG,
      netRemuneration: v.netRemuneration,
      phone: v.worker.phone ?? '',
      email: v.worker.email ?? '',
    });

    // Lock location fields if status is ACTIV (RSP validated — only hours, net, phone, email editable)
    if (v.status === 'Activ') {
      ['workDate', 'workDistrict', 'workLocality', 'workAddress', 'art5Alin1LitB', 'art5Alin1LitG']
        .forEach(f => this.form.get(f)?.disable());
    }

    // Trigger tax recalculation
    const net = v.netRemuneration;
    const tax = Math.round(net * 0.12 * 100) / 100;
    const cnas = Math.round(net * 0.06 * 100) / 100;
    this.taxCalc.set({ net, tax, cnas, gross: Math.round((net + tax + cnas) * 100) / 100 });
  }
}
