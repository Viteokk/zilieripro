import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../shared/ui/components/status-badge.component';
import { WorkerDataService } from '../data/worker-data.service';
import { VoucherTableItem, WorkerModel } from '../../../shared/models/voucher.model';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { AuthStore } from '../../../shared/auth/auth.store';
import { WorkerEditComponent } from './worker-edit.component';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog.component';
import { MaskIdnpPipe } from '../../../shared/pipes/mask-idnp.pipe';

@Component({
  selector: 'app-worker-profile',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, TranslatePipe, WorkerEditComponent, ConfirmDialogComponent, MaskIdnpPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Back button -->
      <div class="mb-4">
        <a
          routerLink="/workers"
          class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          {{ 'worker.profile.back' | t }}
        </a>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="text-sm text-muted-foreground">{{ "common.loading" | t }}</div>
        </div>
      }

      @if (worker(); as w) {
        <!-- Worker details card -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-3xl font-bold tracking-tight text-foreground">{{ w.lastName }} {{ w.firstName }}</h1>
            </div>
            @if (!isInspector()) {
              <div class="flex items-center gap-2">
                <button type="button" (click)="onEdit()"
                  class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editare
                </button>
                <button type="button" (click)="onDelete()"
                  class="inline-flex h-9 items-center gap-2 rounded-md border border-destructive text-destructive px-4 text-sm font-medium hover:bg-destructive/10 transition-colors">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Sterge
                </button>
              </div>
            }
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
            <div>
              <dt class="text-sm text-muted-foreground">{{ "field.idnp" | t }}</dt>
              <dd class="mt-1 text-sm font-medium text-foreground font-mono">{{ w.idnp | maskIdnp }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">{{ "field.lastName" | t }}</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.lastName }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">{{ "field.firstName" | t }}</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.firstName }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">{{ "field.birthDate" | t }}</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.birthDate }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">{{ "field.phone" | t }}</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.phone || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">{{ "field.email" | t }}</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">{{ w.email || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">{{ "worker.profile.rspValidated" | t }}</dt>
              <dd class="mt-1 text-sm">
                @if (w.rspValidated) {
                  <span class="inline-flex items-center gap-1 text-success">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ 'common.yes' | t }}
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-1 text-destructive">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {{ 'common.no' | t }}
                  </span>
                }
              </dd>
            </div>
            @if (w.rspValidatedAt) {
              <div>
                <dt class="text-sm text-muted-foreground">{{ "worker.profile.rspDate" | t }}</dt>
                <dd class="mt-1 text-sm font-medium text-foreground">{{ w.rspValidatedAt }}</dd>
              </div>
            }
            @if (w.voucherCount !== undefined) {
              <div>
                <dt class="text-sm text-muted-foreground">{{ "worker.profile.vouchersCount" | t }}</dt>
                <dd class="mt-1 text-sm font-medium text-foreground">{{ w.voucherCount }}</dd>
              </div>
            }
          </div>
        </div>

        <!-- Voucher history table -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
          <div class="px-6 py-4 border-b border-input">
            <h2 class="text-lg font-semibold text-foreground">{{ "worker.profile.history" | t }}</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full caption-bottom text-sm">
              <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
                <tr>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.code' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'common.status' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'common.date' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.hours' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.remunerationNet' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.remunerationGross' | t }}</th>
                  <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">{{ 'field.district' | t }}</th>
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                @for (voucher of vouchers(); track voucher.id) {
                  <tr class="hover:bg-muted/50 border-b border-foreground/5 transition-colors">
                    <td class="p-2 align-middle whitespace-nowrap">
                      <a [routerLink]="['/vouchers', voucher.id]" class="text-primary hover:underline underline-offset-4 font-medium">
                        {{ voucher.code }}
                      </a>
                    </td>
                    <td class="p-2 align-middle whitespace-nowrap">
                      <app-status-badge [status]="voucher.status" />
                    </td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.workDate }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.hoursWorked }}</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.netRemuneration }} MDL</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.grossRemuneration }} MDL</td>
                    <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ voucher.workDistrict }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="p-2 align-middle py-8 text-center text-sm text-muted-foreground">
                      {{ 'common.noResults' | t }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        @if (editing()) {
          <app-worker-edit [worker]="w" (closed)="onEditClosed()" (saved)="onEditSaved($event)" />
        }

        @if (deleting()) {
          <app-confirm-dialog
            title="Sterge lucrator"
            [message]="'Sigur stergi lucratorul ' + w.firstName + ' ' + w.lastName + '? Actiunea este ireversibila.'"
            confirmText="Sterge"
            confirmVariant="destructive"
            [submitting]="deletingSubmitting()"
            (confirmed)="onDeleteConfirmed()"
            (cancelled)="deleting.set(false)" />
        }
      }

      @if (toastMessage(); as msg) {
        <div class="fixed bottom-6 right-6 z-[300] rounded-md bg-foreground text-background px-4 py-2 text-sm shadow-lg">
          {{ msg }}
        </div>
      }
    </div>
  `,
})
export class WorkerProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workerDataService = inject(WorkerDataService);
  private readonly auth = inject(AuthStore);

  protected readonly worker = signal<WorkerModel | null>(null);
  protected readonly vouchers = signal<VoucherTableItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly isInspector = computed(() => this.auth.roleType() === 'Inspector');

  protected readonly editing = signal<boolean>(false);
  protected readonly deleting = signal<boolean>(false);
  protected readonly deletingSubmitting = signal<boolean>(false);
  protected readonly toastMessage = signal<string>('');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  protected onEdit(): void {
    this.editing.set(true);
  }

  protected onEditClosed(): void {
    this.editing.set(false);
  }

  protected onEditSaved(updated: WorkerModel): void {
    this.editing.set(false);
    this.worker.set(updated);
    this.flashToast('Lucrator actualizat');
  }

  protected onDelete(): void {
    this.deleting.set(true);
  }

  protected onDeleteConfirmed(): void {
    const w = this.worker();
    if (!w) return;
    this.deletingSubmitting.set(true);
    this.workerDataService.delete(w.id).subscribe({
      next: () => {
        this.deletingSubmitting.set(false);
        this.deleting.set(false);
        this.router.navigate(['/workers']);
      },
      error: () => {
        this.deletingSubmitting.set(false);
        this.deleting.set(false);
        this.flashToast('Eroare la stergerea lucratorului.');
      },
    });
  }

  private flashToast(msg: string): void {
    this.toastMessage.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set('');
      this.toastTimer = null;
    }, 3000);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadWorker(id);
      this.loadVouchers(id);
    }
  }

  private loadWorker(id: string): void {
    this.loading.set(true);
    this.workerDataService.getWorker(id).subscribe({
      next: (worker) => {
        this.worker.set(worker);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private loadVouchers(workerId: string): void {
    this.workerDataService.getWorkerVouchers(workerId).subscribe({
      next: (result) => {
        this.vouchers.set(result.items);
      },
    });
  }
}
