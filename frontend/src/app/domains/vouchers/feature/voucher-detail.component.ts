import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { ApiService } from '../../../shared/services/api.service';
import { NomenclatorModel } from '../../../shared/models/voucher.model';
import { VoucherDataService } from '../data/voucher-data.service';
import { VoucherActivityItem, VoucherDetail, VoucherStatus, CancellationReasonCode } from '../../../shared/models/voucher.model';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { AuthStore } from '../../../shared/auth/auth.store';
import { MaskIdnpPipe } from '../../../shared/pipes/mask-idnp.pipe';
import { VoucherSignOverlayComponent } from '../ui/voucher-sign-overlay.component';

@Component({
  selector: 'app-voucher-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, UpperCasePipe, TranslatePipe, MaskIdnpPipe, VoucherSignOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Toolbar (hidden on print) -->
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <a routerLink="/vouchers"
           class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; {{ 'worker.profile.back' | t }}
        </a>
        @if (voucher()) {
          <div class="flex flex-wrap gap-2">
            @if (!isInspector()) {
              @if (voucher()!.status === 'Activ' || voucher()!.status === 'Executat') {
                <button type="button" (click)="showSignModal.set(true)"
                  class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  {{ (voucher()!.signatureDataUrl ? 'action.resign' : 'action.sign') | t }}
                </button>
              }
            }
            @if (voucher()!.status === 'Emis') {
              <a [routerLink]="['/vouchers', voucher()!.id, 'edit']"
                 class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                {{ 'action.edit' | t }}
              </a>
              @if (!isInspector()) {
                <button type="button" (click)="activate()"
                  class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90">
                  {{ 'action.activate' | t }}
                </button>
              }
              <button type="button" (click)="showCancelModal.set(true)"
                class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-destructive text-white px-4 text-sm font-medium hover:bg-destructive/90">
                {{ 'action.cancel' | t }}
              </button>
            }
            @if (voucher()!.status === 'Activ') {
              <a [routerLink]="['/vouchers', voucher()!.id, 'edit']"
                 class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                {{ 'action.edit' | t }}
              </a>
              <button type="button" (click)="showCancelModal.set(true)"
                class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-destructive text-white px-4 text-sm font-medium hover:bg-destructive/90">
                {{ 'action.cancel' | t }}
              </button>
            }
            @if (!isInspector()) {
              @if (voucher()!.status === 'Executat') {
                <button type="button" (click)="report()"
                  class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90">
                  {{ 'action.report' | t }}
                </button>
              }
            }
            <a [routerLink]="['/vouchers', voucher()!.id, 'receipt']"
               [queryParams]="{ autoprint: '1' }"
              class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print
            </a>
            <button type="button" (click)="toggleActivity()"
              [class]="showActivity() ? 'inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-accent px-4 text-sm font-medium' : 'inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
              Activitate
            </button>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-muted-foreground">{{ 'common.loading' | t }}</div>
      } @else if (voucher()) {
        @let v = voucher()!;
        <!-- Plain anexa layout — left-aligned, no rings, no shadows, no separator lines -->
        <div class="voucher-sheet text-black text-sm">

          <!-- TITLE -->
          <h1 class="text-2xl font-bold mb-4">Voucher {{ v.code }}</h1>

          <!-- METADATA -->
          <section class="mb-4">
            <dl class="grid grid-cols-[110px_1fr] sm:grid-cols-[200px_1fr] gap-y-1">
              <dt>COD</dt><dd>{{ v.code }}</dd>
              <dt>EMIS</dt><dd>{{ formatDateTime(v.createdAt) }}</dd>
              <dt>STATUT</dt><dd>{{ v.status | uppercase }}</dd>
            </dl>
          </section>

          <!-- BENEFICIAR -->
          <section class="mb-4">
            <h2 class="text-sm font-bold uppercase mb-2">Beneficiarul de lucrari (Angajator)</h2>
            <dl class="grid grid-cols-[110px_1fr] sm:grid-cols-[200px_1fr] gap-y-1">
              <dt>IDNO</dt><dd>{{ v.beneficiary.idno }}</dd>
              <dt>Denumirea companiei</dt><dd>{{ v.beneficiary.companyName }}</dd>
            </dl>
          </section>

          <!-- ZILIER -->
          <section class="mb-4">
            <h2 class="text-sm font-bold uppercase mb-2">Zilierul (Lucrator)</h2>
            <dl class="grid grid-cols-[110px_1fr] sm:grid-cols-[200px_1fr] gap-y-1">
              <dt>IDNP</dt><dd>{{ v.worker.idnp | maskIdnp }}</dd>
              <dt>Numele</dt><dd>{{ v.worker.lastName }}</dd>
              <dt>Prenumele</dt><dd>{{ v.worker.firstName }}</dd>
              @if ((v.workerPhone ?? v.worker?.phone); as phone) {
                <dt>Telefon</dt><dd>{{ phone }}</dd>
              }
              @if ((v.workerEmail ?? v.worker?.email); as email) {
                <dt>Email</dt><dd>{{ email }}</dd>
              }
            </dl>
          </section>

          <!-- DETALII ACTIVITATE -->
          <section class="mb-4">
            <h2 class="text-sm font-bold uppercase mb-2">Detalii activitate</h2>
            <dl class="grid grid-cols-[110px_1fr] sm:grid-cols-[200px_1fr] gap-y-1">
              <dt>Ziua de activitate</dt><dd>{{ formatDate(v.workDate) }}</dd>
              <dt>Numarul de ore lucrate</dt><dd>{{ v.hoursWorked }}</dd>
              <dt>Locul exercitarii activitatii</dt>
              <dd>
                {{ v.workLocality }}, {{ v.workDistrict }}
                @if (v.workAddress) { <br/>{{ v.workAddress }} }
              </dd>
              <dt>Activitatea realizata</dt><dd>{{ activityLabel(v.activityType) }}</dd>
            </dl>
          </section>

          <!-- DATE FINANCIARE -->
          <section class="mb-4">
            <h2 class="text-sm font-bold uppercase mb-2">Date financiare</h2>
            <dl class="grid grid-cols-[110px_1fr] sm:grid-cols-[200px_1fr] gap-y-1">
              <dt>Remuneratia neta (MDL)</dt><dd>{{ formatMoney(v.netRemuneration) }}</dd>
              <dt>Impozit pe venit 12% (MDL)</dt><dd>{{ formatMoney(v.incomeTax) }}</dd>
              <dt>Contributii CNAS 6% (MDL)</dt><dd>{{ formatMoney(v.cnasContribution) }}</dd>
              <dt>Remuneratia bruta (MDL)</dt><dd>{{ formatMoney(v.grossRemuneration) }}</dd>
            </dl>
          </section>

          <!-- CONFIRMARE -->
          <section class="mb-4">
            <h2 class="text-sm font-bold uppercase mb-1">Confirmarea prestarii si primirii remuneratiei</h2>
            <p>
              Prin semnarea prezentului voucher, zilierul confirma prestarea activitatii
              si primirea remuneratiei in cuantumul indicat mai sus.
            </p>
          </section>

          <!-- CANCELLATION (if applicable) -->
          @if (v.status === 'Anulat') {
            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase mb-2">Voucher anulat</h2>
              <dl class="grid grid-cols-[110px_1fr] sm:grid-cols-[200px_1fr] gap-y-1">
                <dt>Motiv</dt><dd>{{ cancelReasonLabel(v.cancellationReason!) }}</dd>
                @if (v.cancellationNote) { <dt>Comentarii</dt><dd>{{ v.cancellationNote }}</dd> }
                @if (v.cancellationDate) { <dt>Data anularii</dt><dd>{{ formatDateTime(v.cancellationDate) }}</dd> }
              </dl>
            </section>
          }

          <!-- SIGNATURE AREA — only on print -->
          <section class="signature-area mt-8 mb-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <div class="text-xs mb-8">Semnatura zilierului (olografa)</div>
                <div class="h-12 border-b border-black"></div>
              </div>
              <div>
                <div class="text-xs mb-2">Semnatura electronica a entitatii</div>
                @if (v.signatureDataUrl) {
                  <div class="h-12 border-b border-black flex items-end justify-center">
                    <img [src]="v.signatureDataUrl" alt="Semnatura" class="max-h-full object-contain" />
                  </div>
                  <div class="text-[10px] mt-1">
                    @if (v.signedAt; as s) { {{ formatDateTime(s) }} }
                  </div>
                } @else {
                  <div class="h-12 border-b border-black flex items-center justify-center">
                    <span class="text-[10px] italic">[Aplicata automat la imprimare]</span>
                  </div>
                }
              </div>
            </div>
          </section>

          <!-- FOOTER -->
          <div class="mt-6">
            Prezentul voucher constituie dovada remuneratiei zilierului — Art. 9 alin. (3), Legea nr. 22/2018.<br/>
            Document generat automat din sistemul informational eZilier.
          </div>
        </div>

        @if (showActivity()) {
          <div class="mt-6 print:hidden">
            <h3 class="text-sm font-semibold mb-3 text-gray-900">Activitate voucher</h3>
            @if (activityLoading()) {
              <p class="text-sm text-muted-foreground">Se incarca...</p>
            } @else if (activity().length === 0) {
              <p class="text-sm text-muted-foreground">Nicio activitate inregistrata.</p>
            } @else {
              <div class="flex flex-col gap-2">
                @for (item of activity(); track item.timestamp) {
                  <div class="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                    <svg class="mt-0.5 size-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/>
                    </svg>
                    <div>
                      <p class="text-sm font-semibold text-gray-900">{{ item.userFullName ? item.userFullName + ' ' : '' }}{{ item.actionLabel }}</p>
                      <p class="text-xs text-gray-500">{{ formatDateTime(item.timestamp) }}</p>
                      @if (item.changes && item.changes.length > 0) {
                        <ul class="mt-1 space-y-0.5">
                          @for (change of item.changes; track change) {
                            <li class="text-xs text-gray-600">{{ change }}</li>
                          }
                        </ul>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      }

      <!-- Cancel modal -->
      @if (showCancelModal()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 print:hidden"
             (click)="!showCancelConfirm() && showCancelModal.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md relative overflow-y-auto max-h-[90dvh]"
               (click)="$event.stopPropagation()">
            <div class="p-6">
              <h3 class="text-lg font-semibold mb-4 text-gray-900">{{ 'voucher.detail.cancelModal' | t }}</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Data anularii <span class="text-destructive">*</span></label>
                  <input type="date" [(ngModel)]="cancelDate"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Motiv anulare <span class="text-destructive">*</span></label>
                  <select [(ngModel)]="cancelReasonCode"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm">
                    <option value="">Selectati motivul</option>
                    @for (r of cancelReasons(); track r.id) {
                      <option [value]="r.code">{{ r.titleRo }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Comentarii</label>
                  <textarea [(ngModel)]="cancelNote" rows="3" maxlength="500"
                    class="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm"></textarea>
                  <p class="text-xs text-muted-foreground mt-1">{{ cancelNote.length }}/500</p>
                </div>
              </div>
              <div class="mt-5 flex justify-end gap-2">
                <button type="button" (click)="showCancelModal.set(false)"
                  class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm">{{ 'action.close' | t }}</button>
                <button type="button" (click)="showCancelConfirm.set(true)" [disabled]="!cancelReasonCode || !cancelDate"
                  class="inline-flex h-9 items-center justify-center rounded-md bg-destructive text-white px-4 text-sm font-medium disabled:opacity-50">{{ 'voucher.detail.confirmCancel' | t }}</button>
              </div>
            </div>

            <!-- ─── Inline confirmation sheet ─── -->
            @if (showCancelConfirm()) {
              <div class="absolute inset-0 z-10 flex flex-col justify-end"
                   style="background: rgba(0,0,0,0.45); backdrop-filter: blur(2px);"
                   (click)="!cancelSubmitting() && showCancelConfirm.set(false)">
                <div class="bg-white rounded-t-2xl p-5 space-y-4" (click)="$event.stopPropagation()">

                  <!-- Icon + title -->
                  <div class="flex items-center gap-3">
                    <div class="size-11 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5 text-red-600">
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71
                             c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898
                             0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-base font-bold text-gray-900">Confirmați anularea?</p>
                      <p class="text-sm text-gray-500">Voucher {{ voucher()?.code }}</p>
                    </div>
                  </div>

                  <!-- Summary -->
                  <div class="bg-red-50 rounded-xl px-4 py-3 space-y-1.5">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-500">Data anulării</span>
                      <span class="font-semibold text-gray-800">{{ cancelDate }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-500">Motiv</span>
                      <span class="font-semibold text-gray-800 text-right max-w-[60%]">{{ cancelReasonLabel(cancelReasonCode) }}</span>
                    </div>
                    @if (cancelNote) {
                      <div class="flex justify-between text-sm border-t border-red-100 pt-1.5">
                        <span class="text-gray-500">Comentarii</span>
                        <span class="text-gray-700 text-right max-w-[60%]">{{ cancelNote }}</span>
                      </div>
                    }
                  </div>

                  <!-- Disclaimer -->
                  <p class="text-[12px] text-gray-500 text-center leading-relaxed">
                    Această acțiune este <strong class="text-red-600">ireversibilă</strong>.
                    Voucherul va fi anulat și nu va mai putea fi activat sau executat.
                  </p>

                  <!-- Buttons -->
                  <div class="flex gap-3">
                    <button type="button" (click)="showCancelConfirm.set(false)"
                      [disabled]="cancelSubmitting()"
                      class="flex-1 h-12 rounded-xl border border-gray-200 text-sm font-semibold
                             text-gray-700 hover:bg-gray-50 active:bg-gray-100
                             transition-colors touch-manipulation disabled:opacity-50">
                      Renunță
                    </button>
                    <button type="button" (click)="confirmCancel()"
                      [disabled]="cancelSubmitting()"
                      class="flex-[2] h-12 rounded-xl bg-red-600 text-white text-sm font-bold
                             hover:bg-red-700 active:bg-red-800 transition-colors
                             touch-manipulation disabled:opacity-70">
                      @if (cancelSubmitting()) {
                        <span class="flex items-center justify-center gap-2">
                          <svg class="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"
                                    stroke-dasharray="31.4 62.8" stroke-linecap="round"/>
                          </svg>
                          Se anulează...
                        </span>
                      } @else {
                        Da, anulez voucherul
                      }
                    </button>
                  </div>

                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Signature overlay -->
      @if (showSignModal()) {
        <app-voucher-sign-overlay
          [code]="voucher()!.code"
          [workerName]="voucher()!.worker.firstName + ' ' + voucher()!.worker.lastName"
          [workDate]="formatDate(voucher()!.workDate)"
          [netAmount]="formatMoney(voucher()!.netRemuneration)"
          [saving]="saving()"
          (confirmed)="saveSignature($event)"
          (cancelled)="showSignModal.set(false)"
        />
      }
    </div>

    <style>
      /* On screen the voucher uses the full content width like the other
         pages; A5 sizing applies only when printing. */
      :host ::ng-deep .voucher-sheet { width: 100%; }

      /* On-screen: hide the signature section — it appears only at print. */
      :host ::ng-deep .signature-area { display: none; }

      @media print {
        :host ::ng-deep .signature-area { display: block !important; }
        @page { size: A4 portrait; margin: 12mm; }
        :host ::ng-deep .voucher-sheet { max-width: 100%; box-shadow: none !important; border-radius: 0 !important; font-size: 11pt; }
        :host ::ng-deep .voucher-sheet h1 { font-size: 16pt; margin-bottom: 8mm; }
        :host ::ng-deep .voucher-sheet h2 { font-size: 11pt; margin-bottom: 2mm; }
        :host ::ng-deep .voucher-sheet section { margin-bottom: 4mm; page-break-inside: avoid; }
        :host ::ng-deep .voucher-sheet dl { row-gap: 0.5mm; }
        body { background: white !important; }
      }
    </style>

  `,
})
export class VoucherDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly voucherDataService = inject(VoucherDataService);
  private readonly api = inject(ApiService);
  private readonly authStore = inject(AuthStore);

  protected readonly isInspector = computed(() => this.authStore.roleType() === 'Inspector');

  protected readonly voucher = signal<VoucherDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly showCancelModal = signal(false);
  protected readonly showCancelConfirm = signal(false);
  protected readonly cancelSubmitting = signal(false);
  protected readonly showSignModal = signal(false);
  protected readonly saving = signal(false);
  protected readonly showActivity = signal(false);
  protected readonly activity = signal<VoucherActivityItem[]>([]);
  protected readonly activityLoading = signal(false);
  protected readonly activityTypes = signal<NomenclatorModel[]>([]);
  protected readonly cancelReasons = signal<NomenclatorModel[]>([]);
  protected cancelReasonCode = '';
  protected cancelNote = '';
  protected cancelDate = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadVoucher(id);
    this.api.getNomenclators('activity_types').subscribe({
      next: (list) => this.activityTypes.set(list ?? []),
    });
    this.api.getNomenclators('cancellation_reasons').subscribe({
      next: (list) => this.cancelReasons.set(list ?? []),
    });
  }

  protected activityLabel(code?: string): string {
    if (!code) return '—';
    const found = this.activityTypes().find((n) => n.code === code);
    return found?.titleRo || code;
  }

  protected print(): void { window.print(); }

  protected activate(): void {
    this.voucherDataService.activateVoucher(this.voucher()!.id).subscribe({
      next: (v) => this.voucher.set(v),
    });
  }

  protected execute(): void {
    this.voucherDataService.executeVoucher(this.voucher()!.id).subscribe({
      next: (v) => this.voucher.set(v),
    });
  }

  protected report(): void {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.voucherDataService.reportVoucher(this.voucher()!.id, period).subscribe({
      next: (v) => this.voucher.set(v),
    });
  }

  protected saveSignature(data: string): void {
    this.saving.set(true);
    this.voucherDataService.signVoucher(this.voucher()!.id, data).subscribe({
      next: (v) => {
        this.voucher.set(v);
        this.saving.set(false);
        this.showSignModal.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  protected confirmCancel(): void {
    if (!this.cancelReasonCode || !this.cancelDate) return;
    this.cancelSubmitting.set(true);
    this.voucherDataService
      .cancelVoucher(this.voucher()!.id, {
        reasonCode: this.cancelReasonCode,
        cancellationDate: this.cancelDate,
        note: this.cancelNote || undefined,
      })
      .subscribe({
        next: (v) => {
          this.voucher.set(v);
          this.showCancelModal.set(false);
          this.showCancelConfirm.set(false);
          this.cancelSubmitting.set(false);
          this.cancelReasonCode = '';
          this.cancelNote = '';
          this.cancelDate = new Date().toISOString().split('T')[0];
        },
        error: () => this.cancelSubmitting.set(false),
      });
  }

  protected cancelReasonLabel(code: string): string {
    const found = this.cancelReasons().find((r) => r.code.replace('-', '') === code);
    return found?.titleRo || code;
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    const [y, m, day] = iso.split('-');
    return `${day}.${m}.${y}`;
  }

  protected formatDateTime(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${date} ${time}`;
  }

  protected toggleActivity(): void {
    const next = !this.showActivity();
    this.showActivity.set(next);
    if (next && this.activity().length === 0) {
      this.activityLoading.set(true);
      this.api.getVoucherActivity(this.voucher()!.id).subscribe({
        next: (items) => { this.activity.set(items); this.activityLoading.set(false); },
        error: () => this.activityLoading.set(false),
      });
    }
  }

  protected formatMoney(n: number): string {
    return (Number(n) || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private loadVoucher(id: string): void {
    this.loading.set(true);
    this.voucherDataService.getVoucher(id).subscribe({
      next: (v) => { this.voucher.set(v); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
