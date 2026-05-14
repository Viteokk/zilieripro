import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { I18nService } from '../../../shared/i18n/i18n.service';
import { BeneficiaryModel, CreateBeneficiaryRequest } from '../../../shared/models/voucher.model';

@Component({
  selector: 'app-company-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, LowerCasePipe],
  template: `
    <div class="p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-800">{{ i18n.t('admin.companies.title') }}</h1>
        <span class="text-sm text-gray-400">{{ totalCount() }} {{ i18n.t('common.total') | lowercase }}</span>
      </div>

      @if (successMsg()) {
        <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
          {{ successMsg() }}
        </div>
      }

      <!-- Filter bar -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
          (keyup.enter)="onSearch()"
          placeholder="Cauta dupa denumire sau IDNO..."
          class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div class="flex gap-2">
          <button (click)="onSearch()"
            class="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
            {{ i18n.t('action.search') }}
          </button>
          <button (click)="openForm()"
            class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            {{ i18n.t('admin.companies.add') }}
          </button>
        </div>
      </div>

      <!-- Create form -->
      @if (showForm()) {
        <div class="bg-white rounded-xl shadow-sm border border-blue-100 p-5 space-y-4">
          <h2 class="text-base font-semibold text-gray-700">{{ i18n.t('admin.companies.add') }}</h2>
          @if (formError()) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{{ formError() }}</div>
          }
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-medium text-gray-600">{{ i18n.t('admin.companies.form.companyName') }} *</label>
              <input [(ngModel)]="form.companyName" type="text"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-gray-600">{{ i18n.t('admin.companies.form.idno') }} *</label>
              <input [(ngModel)]="form.idno" type="text" maxlength="13"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-gray-600">{{ i18n.t('admin.companies.form.legalForm') }}</label>
              <input [(ngModel)]="form.legalForm" type="text"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-gray-600">{{ i18n.t('admin.companies.form.activityType') }}</label>
              <input [(ngModel)]="form.activityType" type="text"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="space-y-1 sm:col-span-2">
              <label class="text-xs font-medium text-gray-600">{{ i18n.t('admin.companies.form.address') }}</label>
              <input [(ngModel)]="form.address" type="text"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <button (click)="closeForm()"
              class="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
              {{ i18n.t('action.cancel') }}
            </button>
            <button (click)="submit()" [disabled]="submitting()"
              class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
              {{ submitting() ? i18n.t('common.processing') : i18n.t('action.save') }}
            </button>
          </div>
        </div>
      }

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        @if (loading()) {
          <div class="p-8 text-center text-gray-400 text-sm">{{ i18n.t('common.loading') }}</div>
        } @else if (companies().length === 0) {
          <div class="p-8 text-center text-gray-400 text-sm">{{ i18n.t('admin.companies.empty') }}</div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ i18n.t('field.companyName') }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ i18n.t('field.idno') }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ i18n.t('field.district') }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ i18n.t('field.locality') }}</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Lucrători</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Vouchere</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ i18n.t('field.createdAt') }}</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ i18n.t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (company of companies(); track company.id) {
                  <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-3 font-medium text-gray-800">{{ company.companyName }}</td>
                    <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ company.idno }}</td>
                    <td class="px-4 py-3 text-gray-500">{{ company.district ?? '—' }}</td>
                    <td class="px-4 py-3 text-gray-500">{{ company.locality ?? '—' }}</td>
                    <td class="px-4 py-3 text-center text-gray-500">{{ company.workerCount ?? 0 }}</td>
                    <td class="px-4 py-3 text-center text-gray-500">{{ company.voucherCount ?? 0 }}</td>
                    <td class="px-4 py-3 text-gray-400 text-xs">{{ company.createdAt | date:'dd.MM.yyyy' }}</td>
                    <td class="px-4 py-3 text-center">
                      <button (click)="openLink(company.id)"
                        class="px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors whitespace-nowrap">
                        {{ i18n.t('admin.companies.linkUser') }}
                      </button>
                    </td>
                  </tr>
                  @if (linkTarget() === company.id) {
                    <tr class="bg-indigo-50/50 border-b border-indigo-100">
                      <td colspan="8" class="px-4 py-3">
                        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <span class="text-xs font-medium text-indigo-700 shrink-0">{{ i18n.t('admin.companies.linkUser') }}:</span>
                          <input
                            type="text"
                            [ngModel]="linkIdnp()"
                            (ngModelChange)="linkIdnp.set($event)"
                            (keyup.enter)="submitLink()"
                            maxlength="13"
                            placeholder="{{ i18n.t('admin.companies.linkUser.idnp') }} (13 cifre)"
                            class="flex-1 min-w-0 px-3 py-1.5 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono bg-white"
                          />
                          @if (linkError()) {
                            <span class="text-xs text-red-600 shrink-0">{{ linkError() }}</span>
                          }
                          @if (linkSuccessMsg()) {
                            <span class="text-xs text-green-600 shrink-0">{{ linkSuccessMsg() }}</span>
                          }
                          <div class="flex gap-2 shrink-0">
                            <button (click)="submitLink()" [disabled]="linkSubmitting()"
                              class="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
                              {{ linkSubmitting() ? i18n.t('common.processing') : i18n.t('action.save') }}
                            </button>
                            <button (click)="closeLink()"
                              class="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                              {{ i18n.t('action.cancel') }}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (totalCount() > limit) {
        <div class="flex items-center justify-between text-sm text-gray-500">
          <span>{{ i18n.t('common.total') }}: {{ totalCount() }}</span>
          <div class="flex items-center gap-2">
            <button (click)="prevPage()" [disabled]="!hasPrev"
              class="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">←</button>
            <span class="px-2 text-xs">{{ currentPage }} / {{ totalPages }}</span>
            <button (click)="nextPage()" [disabled]="!hasNext"
              class="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">→</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class CompanyManagementComponent implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly i18n = inject(I18nService);

  protected readonly companies = signal<BeneficiaryModel[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly search = signal('');
  protected readonly offset = signal(0);
  protected readonly limit = 25;
  protected readonly showForm = signal(false);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly successMsg = signal<string | null>(null);

  protected readonly linkTarget = signal<string | null>(null);
  protected readonly linkIdnp = signal('');
  protected readonly linkError = signal<string | null>(null);
  protected readonly linkSuccessMsg = signal<string | null>(null);
  protected readonly linkSubmitting = signal(false);

  protected form: CreateBeneficiaryRequest = { companyName: '', idno: '' };

  ngOnInit(): void {
    this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      const params: Record<string, string | number | boolean> = {
        offset: this.offset(),
        limit: this.limit,
      };
      if (this.search()) params['search'] = this.search();
      const result = await firstValueFrom(this.api.getBeneficiaries(params));
      this.companies.set(result.items);
      this.totalCount.set(result.totalCount);
    } finally {
      this.loading.set(false);
    }
  }

  protected onSearch(): void {
    this.offset.set(0);
    this.load();
  }

  protected nextPage(): void {
    this.offset.update(v => v + this.limit);
    this.load();
  }

  protected prevPage(): void {
    this.offset.update(v => Math.max(0, v - this.limit));
    this.load();
  }

  protected openForm(): void {
    this.form = { companyName: '', idno: '', legalForm: '', activityType: '', address: '' };
    this.formError.set(null);
    this.successMsg.set(null);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.formError.set(null);
  }

  protected async submit(): Promise<void> {
    this.formError.set(null);
    if (!this.form.companyName?.trim()) {
      this.formError.set(this.i18n.t('admin.companies.form.companyName') + ' este obligatorie.');
      return;
    }
    if (!this.form.idno?.trim() || this.form.idno.trim().length !== 13) {
      this.formError.set(this.i18n.t('admin.companies.form.idno') + ': trebuie să conțină exact 13 caractere.');
      return;
    }
    this.submitting.set(true);
    try {
      await firstValueFrom(this.api.createBeneficiary(this.form));
      this.closeForm();
      this.successMsg.set(this.i18n.t('admin.companies.created'));
      await this.load();
      setTimeout(() => this.successMsg.set(null), 4000);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        this.formError.set(this.i18n.t('admin.companies.duplicate'));
      } else {
        this.formError.set('Eroare la salvare. Reîncercați.');
      }
    } finally {
      this.submitting.set(false);
    }
  }

  protected openLink(companyId: string): void {
    this.linkTarget.set(companyId);
    this.linkIdnp.set('');
    this.linkError.set(null);
    this.linkSuccessMsg.set(null);
  }

  protected closeLink(): void {
    this.linkTarget.set(null);
    this.linkError.set(null);
    this.linkSuccessMsg.set(null);
  }

  protected async submitLink(): Promise<void> {
    const idnp = this.linkIdnp().trim();
    const companyId = this.linkTarget();
    if (!companyId) return;
    if (idnp.length !== 13) {
      this.linkError.set('IDNP trebuie să aibă exact 13 cifre.');
      return;
    }
    this.linkError.set(null);
    this.linkSubmitting.set(true);
    try {
      await firstValueFrom(this.api.linkUserToBeneficiary(companyId, idnp));
      this.linkSuccessMsg.set(this.i18n.t('admin.companies.linkUser.success'));
      this.linkIdnp.set('');
      setTimeout(() => this.closeLink(), 2500);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        this.linkError.set(this.i18n.t('admin.companies.linkUser.notFound'));
      } else if (status === 409) {
        this.linkError.set(this.i18n.t('admin.companies.linkUser.duplicate'));
      } else {
        this.linkError.set('Eroare la asociere. Reîncercați.');
      }
    } finally {
      this.linkSubmitting.set(false);
    }
  }

  protected get hasPrev(): boolean { return this.offset() > 0; }
  protected get hasNext(): boolean { return this.offset() + this.limit < this.totalCount(); }
  protected get currentPage(): number { return Math.floor(this.offset() / this.limit) + 1; }
  protected get totalPages(): number { return Math.ceil(this.totalCount() / this.limit) || 1; }
}
