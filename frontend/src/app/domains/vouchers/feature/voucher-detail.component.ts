import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { ApiService } from '../../../shared/services/api.service';
import { NomenclatorModel } from '../../../shared/models/voucher.model';
import { VoucherDataService } from '../data/voucher-data.service';
import { VoucherDetail, VoucherStatus, CancellationReasonCode } from '../../../shared/models/voucher.model';
import { SignaturePadComponent } from '../../../shared/ui/components/signature-pad.component';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { AuthStore } from '../../../shared/auth/auth.store';

@Component({
  selector: 'app-voucher-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, UpperCasePipe, SignaturePadComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Toolbar (hidden on print) -->
      <div class="mb-4 flex items-center justify-between print:hidden">
        <a routerLink="/vouchers"
           class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; {{ 'worker.profile.back' | t }}
        </a>
        @if (voucher()) {
          <div class="flex items-center gap-2">
            @if (!isInspector()) {
              @if (voucher()!.status === 'Activ' || voucher()!.status === 'Executat') {
                <button type="button" (click)="showSignModal.set(true)"
                  class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  {{ (voucher()!.signatureDataUrl ? 'action.resign' : 'action.sign') | t }}
                </button>
              }
              @if (voucher()!.status === 'Emis') {
                <a [routerLink]="['/vouchers', voucher()!.id, 'edit']"
                   class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  {{ 'action.edit' | t }}
                </a>
                <button type="button" (click)="activate()"
                  class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90">
                  {{ 'action.activate' | t }}
                </button>
                <button type="button" (click)="showCancelModal.set(true)"
                  class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-destructive text-white px-4 text-sm font-medium hover:bg-destructive/90">
                  {{ 'action.cancel' | t }}
                </button>
              }
              @if (voucher()!.status === 'Activ') {
                <button type="button" (click)="execute()"
                  class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90">
                  {{ 'action.execute' | t }}
                </button>
                <button type="button" (click)="showCancelModal.set(true)"
                  class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-destructive text-white px-4 text-sm font-medium hover:bg-destructive/90">
                  {{ 'action.cancel' | t }}
                </button>
              }
              @if (voucher()!.status === 'Executat') {
                <button type="button" (click)="report()"
                  class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90">
                  {{ 'action.report' | t }}
                </button>
              }
            }
            <a [routerLink]="['/vouchers', voucher()!.id, 'receipt']"
              class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0-3-3m3 3 3-3M3 17V7a2 2 0 0 1 2-2h6l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              Chitanta
            </a>
            <button type="button" (click)="print()"
              class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print
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
            <dl class="grid grid-cols-[200px_1fr] gap-y-1">
              <dt>COD</dt><dd>{{ v.code }}</dd>
              <dt>EMIS</dt><dd>{{ formatDateTime(v.createdAt) }}</dd>
              <dt>STATUT</dt><dd>{{ v.status | uppercase }}</dd>
            </dl>
          </section>

          <!-- BENEFICIAR -->
          <section class="mb-4">
            <h2 class="text-sm font-bold uppercase mb-2">Beneficiarul de lucrari (Angajator)</h2>
            <dl class="grid grid-cols-[200px_1fr] gap-y-1">
              <dt>IDNO</dt><dd>{{ v.beneficiary.idno }}</dd>
              <dt>Denumirea companiei</dt><dd>{{ v.beneficiary.companyName }}</dd>
            </dl>
          </section>

          <!-- ZILIER -->
          <section class="mb-4">
            <h2 class="text-sm font-bold uppercase mb-2">Zilierul (Lucrator)</h2>
            <dl class="grid grid-cols-[200px_1fr] gap-y-1">
              <dt>IDNP</dt><dd>{{ v.worker.idnp }}</dd>
              <dt>Numele</dt><dd>{{ v.worker.lastName }}</dd>
              <dt>Prenumele</dt><dd>{{ v.worker.firstName }}</dd>
            </dl>
          </section>

          <!-- DETALII ACTIVITATE -->
          <section class="mb-4">
            <h2 class="text-sm font-bold uppercase mb-2">Detalii activitate</h2>
            <dl class="grid grid-cols-[200px_1fr] gap-y-1">
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
            <dl class="grid grid-cols-[200px_1fr] gap-y-1">
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
              <dl class="grid grid-cols-[200px_1fr] gap-y-1">
                <dt>Motiv</dt><dd>{{ cancelReasonLabel(v.cancellationReason!) }}</dd>
                @if (v.cancellationNote) { <dt>Nota</dt><dd>{{ v.cancellationNote }}</dd> }
                @if (v.cancellationDate) { <dt>Data anularii</dt><dd>{{ formatDateTime(v.cancellationDate) }}</dd> }
              </dl>
            </section>
          }

          <!-- SIGNATURE AREA — only on print -->
          <section class="signature-area mt-8 mb-4">
            <div class="grid grid-cols-2 gap-8">
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
      }

      <!-- Cancel modal -->
      @if (showCancelModal()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 print:hidden" (click)="showCancelModal.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold mb-4">{{ 'voucher.detail.cancelModal' | t }}</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1">{{ 'field.reason' | t }}</label>
                <select [(ngModel)]="cancelReasonCode"
                  class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm">
                  <option value="CA01">CA01 — Eroare la emitere</option>
                  <option value="CA02">CA02 — Renuntare lucrator</option>
                  <option value="CA03">CA03 — Alt motiv</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">{{ 'field.note' | t }}</label>
                <textarea [(ngModel)]="cancelNote" rows="3"
                  class="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm"></textarea>
              </div>
            </div>
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" (click)="showCancelModal.set(false)"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm">{{ 'action.close' | t }}</button>
              <button type="button" (click)="confirmCancel()"
                class="inline-flex h-9 items-center justify-center rounded-md bg-destructive text-white px-4 text-sm font-medium">{{ 'voucher.detail.confirmCancel' | t }}</button>
            </div>
          </div>
        </div>
      }

      <!-- Signature modal -->
      @if (showSignModal()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 print:hidden" (click)="showSignModal.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold mb-1">{{ 'voucher.detail.signModal' | t }}</h3>
            <p class="text-sm text-muted-foreground mb-4">{{ 'voucher.detail.signModalHint' | t }}</p>
            <app-signature-pad (changed)="signatureData.set($event)" />
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" (click)="showSignModal.set(false)"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm">{{ 'action.cancel' | t }}</button>
              <button type="button" (click)="saveSignature()" [disabled]="!signatureData() || saving()"
                class="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                @if (saving()) { {{ 'common.processing' | t }} } @else { {{ 'voucher.detail.saveSignature' | t }} }
              </button>
            </div>
          </div>
        </div>
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
  protected readonly showSignModal = signal(false);
  protected readonly signatureData = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly activityTypes = signal<NomenclatorModel[]>([]);
  protected cancelReasonCode = 'CA01';
  protected cancelNote = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadVoucher(id);
    this.api.getNomenclators('activity_types').subscribe({
      next: (list) => this.activityTypes.set(list ?? []),
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

  protected saveSignature(): void {
    const data = this.signatureData();
    if (!data) return;
    this.saving.set(true);
    this.voucherDataService.signVoucher(this.voucher()!.id, data).subscribe({
      next: (v) => {
        this.voucher.set(v);
        this.saving.set(false);
        this.showSignModal.set(false);
        this.signatureData.set(null);
      },
      error: () => this.saving.set(false),
    });
  }

  protected confirmCancel(): void {
    this.voucherDataService
      .cancelVoucher(this.voucher()!.id, { reason: this.cancelReasonCode, note: this.cancelNote || undefined })
      .subscribe({
        next: (v) => {
          this.voucher.set(v);
          this.showCancelModal.set(false);
          this.cancelReasonCode = 'CA01';
          this.cancelNote = '';
        },
      });
  }

  protected cancelReasonLabel(code: CancellationReasonCode): string {
    const labels: Record<CancellationReasonCode, string> = {
      CA01: 'Eroare la emitere',
      CA02: 'Renuntare lucrator',
      CA03: 'Alt motiv',
    };
    return labels[code] || code;
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
