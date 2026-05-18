import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VoucherDataService } from '../data/voucher-data.service';
import { VoucherDetail } from '../../../shared/models/voucher.model';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-voucher-receipt',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <!-- Toolbar (hidden on print) -->
      <div class="mb-4 flex items-center justify-between print:hidden">
        <a routerLink="/vouchers" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; {{ 'worker.profile.back' | t }}
        </a>
        <button type="button" (click)="print()"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          {{ 'receipt.printPdf' | t }}
        </button>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-muted-foreground">{{ 'common.loading' | t }}</div>
      } @else if (voucher()) {
        @let v = voucher()!;
        <!-- A5 voucher sheet. On screen we show full-color card; on print we strip chrome. -->
        <div class="voucher-sheet bg-white rounded-xl ring-1 ring-foreground/10 shadow-sm mx-auto
                    print:rounded-none print:ring-0 print:shadow-none print:max-w-none">

          <!-- HEADER -->
          <div class="px-8 pt-8 pb-4 text-center border-b border-foreground/20">
            <div class="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Ministerul Muncii si Protectiei Sociale
            </div>
            <h1 class="mt-2 text-2xl font-bold tracking-tight uppercase">
              Voucher digital pentru zilieri
            </h1>
            <div class="mt-3 flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs">
              <div><span class="text-muted-foreground">COD:</span> <span class="font-mono font-bold text-primary">{{ v.code }}</span></div>
              <div><span class="text-muted-foreground">EMIS:</span> <span class="font-medium">{{ formatDateTime(v.createdAt) }}</span></div>
              <div>
                <span [class]="'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ' + statusClass(v.status)">
                  {{ v.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- BENEFICIAR -->
          <section class="px-8 py-4 border-b border-foreground/10">
            <h2 class="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
              Beneficiarul de lucrari (Angajator)
            </h2>
            <dl class="grid grid-cols-[180px_1fr] gap-y-2 gap-x-4 text-sm">
              <dt class="text-muted-foreground">IDNO</dt>
              <dd class="font-mono font-semibold">{{ v.beneficiary.idno }}</dd>
              <dt class="text-muted-foreground">Denumirea companiei</dt>
              <dd class="font-semibold">{{ v.beneficiary.companyName }}</dd>
            </dl>
          </section>

          <!-- ZILIER -->
          <section class="px-8 py-4 border-b border-foreground/10">
            <h2 class="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
              Zilierul (Lucrator)
            </h2>
            <dl class="grid grid-cols-[180px_1fr] gap-y-2 gap-x-4 text-sm">
              <dt class="text-muted-foreground">IDNP</dt>
              <dd class="font-mono font-semibold">{{ v.worker.idnp }}</dd>
              <dt class="text-muted-foreground">Numele</dt>
              <dd class="font-semibold uppercase">{{ v.worker.lastName }}</dd>
              <dt class="text-muted-foreground">Prenumele</dt>
              <dd class="font-semibold">{{ v.worker.firstName }}</dd>
              @if ((v.workerPhone ?? v.worker?.phone); as phone) {
                <dt class="text-muted-foreground">Telefon</dt>
                <dd class="font-semibold">{{ phone }}</dd>
              }
              @if ((v.workerEmail ?? v.worker?.email); as email) {
                <dt class="text-muted-foreground">Email</dt>
                <dd class="font-semibold">{{ email }}</dd>
              }
            </dl>
          </section>

          <!-- DETALII ACTIVITATE -->
          <section class="px-8 py-4 border-b border-foreground/10">
            <h2 class="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
              Detalii activitate
            </h2>
            <dl class="grid grid-cols-[180px_1fr] gap-y-2 gap-x-4 text-sm">
              <dt class="text-muted-foreground">Ziua de activitate</dt>
              <dd class="font-semibold">{{ formatDate(v.workDate) }}</dd>
              <dt class="text-muted-foreground">Numarul de ore lucrate</dt>
              <dd class="font-semibold">{{ v.hoursWorked }}</dd>
              <dt class="text-muted-foreground">Locul exercitarii activitatii</dt>
              <dd class="font-semibold">
                {{ v.workLocality }}, {{ v.workDistrict }}
                @if (v.workAddress) { <br/><span class="text-muted-foreground font-normal">{{ v.workAddress }}</span> }
              </dd>
              <dt class="text-muted-foreground">Activitatea realizata</dt>
              <dd class="font-semibold">Zilier agricultura</dd>
            </dl>
          </section>

          <!-- DATE FINANCIARE -->
          <section class="px-8 py-4 border-b border-foreground/10">
            <h2 class="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
              Date financiare
            </h2>
            <dl class="grid grid-cols-[180px_1fr] gap-y-2 gap-x-4 text-sm">
              <dt class="text-muted-foreground">Remuneratia neta (MDL)</dt>
              <dd class="font-semibold">{{ formatMoney(v.netRemuneration) }}</dd>
              <dt class="text-muted-foreground">Impozit pe venit 12% (MDL)</dt>
              <dd class="font-semibold">{{ formatMoney(v.incomeTax) }}</dd>
              <dt class="text-muted-foreground">Contributii CNAS 6% (MDL)</dt>
              <dd class="font-semibold">{{ formatMoney(v.cnasContribution) }}</dd>
            </dl>
            <div class="mt-3 pt-3 border-t-2 border-foreground/30 grid grid-cols-[180px_1fr] gap-x-4">
              <div class="text-sm font-bold uppercase tracking-wider">Remuneratia bruta (MDL)</div>
              <div class="text-lg font-bold text-primary">{{ formatMoney(v.grossRemuneration) }}</div>
            </div>
          </section>

          <!-- CONFIRMARE — visible on screen + print -->
          <section class="px-8 py-4 border-b border-foreground/10">
            <h2 class="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
              Confirmarea prestarii si primirii remuneratiei
            </h2>
            <p class="text-xs text-foreground/80 leading-relaxed">
              Prin semnarea prezentului voucher, zilierul confirma prestarea activitatii
              si primirea remuneratiei in cuantumul indicat mai sus.
            </p>
          </section>

          <!-- SIGNATURE AREA — only on print (and in a dedicated "print preview" class) -->
          <section class="px-8 py-6 signature-area">
            <div class="grid grid-cols-2 gap-8">
              <div>
                <div class="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-6">
                  Semnatura zilierului (olografa)
                </div>
                <div class="h-16 border-b border-foreground/40"></div>
              </div>
              <div>
                <div class="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                  Semnatura electronica a entitatii
                </div>
                @if (v.signatureDataUrl) {
                  <div class="h-16 border-b border-foreground/40 flex items-end justify-center">
                    <img [src]="v.signatureDataUrl" alt="Semnatura electronica" class="max-h-full object-contain" />
                  </div>
                  <div class="text-[10px] text-muted-foreground mt-1">
                    @if (voucher()?.signedAt; as s) { {{ formatDateTime(s) }} }
                  </div>
                } @else {
                  <div class="h-16 border-b border-foreground/40 flex items-center justify-center">
                    <span class="text-[10px] text-muted-foreground italic">[Aplicata automat la imprimare]</span>
                  </div>
                }
              </div>
            </div>
          </section>

          <!-- FOOTER -->
          <div class="px-8 py-4 text-[10px] text-center text-muted-foreground italic">
            Prezentul voucher constituie dovada remuneratiei zilierului — Art. 9 alin. (3), Legea nr. 22/2018.<br/>
            Document generat automat din sistemul informational eZilier.
          </div>
        </div>
      } @else {
        <div class="text-center py-12 text-destructive">{{ 'common.noResults' | t }}</div>
      }
    </div>

    <style>
      /* Voucher sheet mimics A5 aspect on screen (portrait). */
      :host ::ng-deep .voucher-sheet { max-width: 148mm; min-height: 210mm; }

      /* On-screen: hide the signature section — it appears only at print. */
      :host ::ng-deep .signature-area { display: none; }

      @media print {
        :host ::ng-deep .signature-area { display: block !important; }
        @page { size: A5 portrait; margin: 8mm; }
        :host ::ng-deep .voucher-sheet { width: 100%; min-height: auto; box-shadow: none !important; border-radius: 0 !important; }
        body { background: white !important; }
      }
    </style>
  `,
})
export class VoucherReceiptComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly voucherService = inject(VoucherDataService);

  protected readonly voucher = signal<VoucherDetail | null>(null);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.voucherService.getVoucher(id).subscribe({
      next: (v) => { this.voucher.set(v); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected print(): void { window.print(); }

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

  protected statusClass(status: string): string {
    switch (status) {
      case 'Emis': return 'bg-gray-100 text-gray-700';
      case 'Activ': return 'bg-blue-100 text-blue-700';
      case 'Executat': return 'bg-green-100 text-green-700';
      case 'Raportat': return 'bg-emerald-100 text-emerald-700';
      case 'Anulat': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
