import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
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

              <!-- Raion searchable dropdown -->
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Raion</label>
                <div class="relative">
                  <button type="button"
                    [disabled]="locationLocked()"
                    (click)="districtDropdownOpen.set(!districtDropdownOpen()); $event.stopPropagation()"
                    class="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none text-left disabled:pointer-events-none disabled:opacity-50">
                    <span class="block flex-1 truncate" [class.text-muted-foreground]="!selectedDistrict()">
                      {{ selectedDistrict() || 'Selectati raionul' }}
                    </span>
                    <svg class="ml-2 h-3 w-3 flex-shrink-0 text-foreground/60" viewBox="0 0 12 12" fill="none">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  @if (districtDropdownOpen()) {
                    <div class="fixed inset-0 z-[40]" (click)="districtDropdownOpen.set(false)"></div>
                    <div class="absolute left-0 right-0 top-full mt-1 z-[50] max-h-64 overflow-hidden flex flex-col rounded-md border border-foreground/10 bg-white shadow-lg"
                         (click)="$event.stopPropagation()">
                      <div class="p-2 border-b border-foreground/10">
                        <div class="relative">
                          <svg class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                          </svg>
                          <input type="text" placeholder="Cauta raion..."
                            [value]="districtSearch()"
                            (input)="districtSearch.set($any($event.target).value)"
                            class="w-full h-8 pl-8 pr-2 text-sm border border-input rounded outline-none focus-visible:border-ring" />
                        </div>
                      </div>
                      <div class="overflow-y-auto flex-1">
                        @if (filteredDistricts().length === 0) {
                          <div class="px-3 py-4 text-sm text-muted-foreground text-center">Niciun raion gasit</div>
                        } @else {
                          @for (d of filteredDistricts(); track d) {
                            <div class="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                                 (click)="selectDistrict(d)">
                              @if (selectedDistrict() === d) {
                                <svg class="h-3.5 w-3.5 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                              } @else {
                                <span class="h-3.5 w-3.5 flex-shrink-0"></span>
                              }
                              {{ d }}
                            </div>
                          }
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Localitate searchable dropdown -->
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none select-none">Localitate</label>
                <div class="relative">
                  <button type="button"
                    [disabled]="locationLocked() || !selectedDistrict()"
                    (click)="localityDropdownOpen.set(!localityDropdownOpen()); $event.stopPropagation()"
                    class="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none text-left disabled:pointer-events-none disabled:opacity-50">
                    <span class="block flex-1 truncate" [class.text-muted-foreground]="!selectedLocalityValue()">
                      {{ selectedLocalityValue() || (!selectedDistrict() ? 'Selectati mai intai raionul' : 'Selectati localitatea') }}
                    </span>
                    <svg class="ml-2 h-3 w-3 flex-shrink-0 text-foreground/60" viewBox="0 0 12 12" fill="none">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  @if (localityDropdownOpen() && selectedDistrict()) {
                    <div class="fixed inset-0 z-[40]" (click)="localityDropdownOpen.set(false)"></div>
                    <div class="absolute left-0 right-0 top-full mt-1 z-[50] max-h-64 overflow-hidden flex flex-col rounded-md border border-foreground/10 bg-white shadow-lg"
                         (click)="$event.stopPropagation()">
                      <div class="p-2 border-b border-foreground/10">
                        <div class="relative">
                          <svg class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                          </svg>
                          <input type="text" placeholder="Cauta localitate..."
                            [value]="localitySearch()"
                            (input)="localitySearch.set($any($event.target).value)"
                            class="w-full h-8 pl-8 pr-2 text-sm border border-input rounded outline-none focus-visible:border-ring" />
                        </div>
                      </div>
                      <div class="overflow-y-auto flex-1">
                        @if (filteredLocalities().length === 0) {
                          <div class="px-3 py-4 text-sm text-muted-foreground text-center">Nicio localitate gasita</div>
                        } @else {
                          @for (loc of filteredLocalities(); track loc) {
                            <div class="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                                 (click)="selectLocality(loc)">
                              @if (selectedLocalityValue() === loc) {
                                <svg class="h-3.5 w-3.5 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                              } @else {
                                <span class="h-3.5 w-3.5 flex-shrink-0"></span>
                              }
                              {{ loc }}
                            </div>
                          }
                        }
                      </div>
                    </div>
                  }
                </div>
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

  // Searchable district dropdown
  protected readonly districtSearch = signal('');
  protected readonly districtDropdownOpen = signal(false);
  protected readonly selectedDistrict = signal('');

  // Searchable locality dropdown
  protected readonly localitySearch = signal('');
  protected readonly localityDropdownOpen = signal(false);
  protected readonly selectedLocalityValue = signal('');

  // Locks district/locality dropdowns when voucher is Activ
  protected readonly locationLocked = signal(false);

  private readonly districtLocalities: Record<string, string[]> = {
    Chisinau: ['mun. Chisinau', 'Buiucani', 'Centru', 'Botanica', 'Ciocana', 'Riscani', 'Durlesti', 'Vatra', 'Codru', 'Cricova', 'Sangera', 'Stauceni', 'Ialoveni', 'Straseni'],
    Balti: ['mun. Balti', 'Singerei', 'Falesti', 'Glodeni', 'Riscani'],
    Cahul: ['mun. Cahul', 'Cantemir', 'Taraclia', 'Vulcanesti'],
    Orhei: ['mun. Orhei', 'Criuleni', 'Rezina', 'Telenesti', 'Soldanesti'],
    Ungheni: ['mun. Ungheni', 'Nisporeni', 'Calarasi'],
    Soroca: ['mun. Soroca', 'Drochia', 'Floresti', 'Donduseni'],
    Edinet: ['mun. Edinet', 'Briceni', 'Ocnita', 'Riscani'],
    Comrat: ['mun. Comrat', 'Ceadir-Lunga', 'Vulcanesti', 'Basarabeasca'],
  };

  protected readonly districtList = ['Chisinau', 'Balti', 'Cahul', 'Orhei', 'Ungheni', 'Soroca', 'Edinet', 'Comrat'];

  protected readonly localitiesForDistrict = computed(() => {
    const d = this.selectedDistrict();
    return d ? (this.districtLocalities[d] || []) : [];
  });

  protected readonly filteredDistricts = computed(() => {
    const term = this.districtSearch().toLowerCase();
    return term ? this.districtList.filter(d => d.toLowerCase().includes(term)) : this.districtList;
  });

  protected readonly filteredLocalities = computed(() => {
    const term = this.localitySearch().toLowerCase();
    const list = this.localitiesForDistrict();
    return term ? list.filter(l => l.toLowerCase().includes(term)) : list;
  });

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

  protected selectDistrict(district: string): void {
    this.form.patchValue({ workDistrict: district, workLocality: '' });
    this.selectedDistrict.set(district);
    this.selectedLocalityValue.set('');
    this.districtDropdownOpen.set(false);
    this.districtSearch.set('');
  }

  protected selectLocality(loc: string): void {
    this.form.patchValue({ workLocality: loc });
    this.selectedLocalityValue.set(loc);
    this.localityDropdownOpen.set(false);
    this.localitySearch.set('');
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

    this.selectedDistrict.set(v.workDistrict || '');
    this.selectedLocalityValue.set(v.workLocality || '');

    if (v.status === 'Activ') {
      ['workDate', 'workDistrict', 'workLocality', 'workAddress', 'art5Alin1LitB', 'art5Alin1LitG']
        .forEach(f => this.form.get(f)?.disable());
      this.locationLocked.set(true);
    }

    const net = v.netRemuneration;
    const tax = Math.round(net * 0.12 * 100) / 100;
    const cnas = Math.round(net * 0.06 * 100) / 100;
    this.taxCalc.set({ net, tax, cnas, gross: Math.round((net + tax + cnas) * 100) / 100 });
  }
}
