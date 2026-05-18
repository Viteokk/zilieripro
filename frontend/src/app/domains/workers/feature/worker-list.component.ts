import { ChangeDetectionStrategy, Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorkerDataService } from '../data/worker-data.service';
import { PaginatedResult, WorkerModel } from '../../../shared/models/voucher.model';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { optionalEmailValidator, optionalPhoneValidator } from '../../../shared/validators/optional-contact.validators';
import { AuthStore } from '../../../shared/auth/auth.store';
import { WorkerEditComponent } from './worker-edit.component';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog.component';
import { MaskIdnpPipe } from '../../../shared/pipes/mask-idnp.pipe';

@Component({
  selector: 'app-worker-list',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink, TranslatePipe, WorkerEditComponent, ConfirmDialogComponent, MaskIdnpPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div class="w-full md:mr-4 md:w-auto">
          <h1 class="text-3xl font-bold tracking-tight text-foreground scroll-m-20">{{ 'worker.list.title' | t }}</h1>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" (click)="openCreate()"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-semibold shadow-xs hover:bg-primary/90 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ 'worker.list.create' | t }}
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2 space-y-2">
            <label class="text-sm font-medium leading-none select-none">Cautare dupa IDNP sau nume</label>
            <input
              type="text"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Introduceti IDNP sau numele lucratorului"
              [ngModel]="searchTerm()"
              (ngModelChange)="onSearch($event)"
            />
          </div>
          <div class="flex items-end">
            <button
              class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              (click)="resetFilters()"
            >
              Resetare filtre
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="text-sm text-muted-foreground">{{ 'common.loading' | t }}</div>
        </div>
      }

      <!-- Table -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full caption-bottom text-sm">
            <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
              <tr>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">IDNP</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Nume</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Prenume</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Telefon</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Email</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Actiuni</th>
              </tr>
            </thead>
            <tbody class="[&_tr:last-child]:border-0">
              @for (worker of workers(); track worker.id) {
                <tr class="hover:bg-muted/50 border-b border-foreground/5 transition-colors">
                  <td class="p-2 align-middle whitespace-nowrap font-mono">{{ worker.idnp | maskIdnp }}</td>
                  <td class="p-2 align-middle whitespace-nowrap">
                    <a
                      [routerLink]="['/workers', worker.id]"
                      class="text-primary hover:underline underline-offset-4 font-medium"
                    >
                      {{ worker.lastName }}
                    </a>
                  </td>
                  <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ worker.firstName }}</td>
                  <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ worker.phone || '-' }}</td>
                  <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ worker.email || '-' }}</td>
                  <td class="p-2 align-middle whitespace-nowrap">
                    <div class="relative">
                      <button
                        type="button"
                        aria-label="Actiuni"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        (click)="$event.stopPropagation(); toggleMenu(worker.id, $event.currentTarget)"
                      >
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                      @if (openMenuId() === worker.id && menuPosition(); as pos) {
                        <div
                          class="fixed z-[100] min-w-[200px] rounded-md border border-foreground/10 bg-white p-1 text-foreground shadow-lg"
                          [style.top.px]="pos.top"
                          [style.left.px]="pos.left"
                          (click)="$event.stopPropagation()"
                        >
                          <div class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Actiuni</div>
                          <a
                            [routerLink]="['/workers', worker.id]"
                            class="relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            (click)="closeMenu()"
                          >
                            <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Vizualizare
                          </a>
                          @if (!isInspector()) {
                            <button
                              type="button"
                              class="relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                              (click)="onEdit(worker)"
                            >
                              <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editare
                            </button>
                            <button
                              type="button"
                              class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none text-destructive hover:bg-destructive/10 transition-colors"
                              (click)="onDelete(worker); closeMenu()"
                            >
                              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Sterge
                            </button>
                          }
                        </div>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="p-2 align-middle py-8 text-center text-sm text-muted-foreground">
                    Nu au fost gasiti lucratori zilieri.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalCount() > 0) {
          <div class="px-4 py-3 border-t border-input flex items-center justify-between">
            <div class="text-sm text-muted-foreground">
              Afisare {{ offset() + 1 }} - {{ Math.min(offset() + limit(), totalCount()) }}
              din {{ totalCount() }} rezultate
            </div>
            <div class="flex items-center gap-2">
              <button
                class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                [disabled]="offset() === 0"
                (click)="prevPage()"
              >
                Inapoi
              </button>
              <button
                class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                [disabled]="offset() + limit() >= totalCount()"
                (click)="nextPage()"
              >
                Inainte
              </button>
            </div>
          </div>
        }
      </div>

      <!-- MODAL: ADAUGA LUCRATOR -->
      @if (showCreate()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" (click)="closeCreate()">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-6 pb-4 border-b border-foreground/10">
              <h3 class="text-lg font-semibold">{{ 'worker.list.create' | t }}</h3>
              <p class="text-sm text-muted-foreground">Adaugati un lucrator nou in registrul companiei.</p>
            </div>

            <div class="p-6 overflow-y-auto flex-1">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3" [formGroup]="newWorkerForm">
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Nume *</label>
                  <input type="text" formControlName="lastName" placeholder="Popescu"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Prenume *</label>
                  <input type="text" formControlName="firstName" placeholder="Ion"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">IDNP *</label>
                  <input type="text" formControlName="idnp" maxlength="13" placeholder="13 cifre"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Data nasterii *</label>
                  <input type="date" formControlName="birthDate" [max]="todayIso"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Telefon (optional)</label>
                  <input type="tel" formControlName="phone" placeholder="+37360123456"
                    class="flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm"
                    [class.border-destructive]="newWorkerForm.controls.phone.invalid && newWorkerForm.controls.phone.touched"
                    [class.border-input]="!(newWorkerForm.controls.phone.invalid && newWorkerForm.controls.phone.touched)" />
                  @if (newWorkerForm.controls.phone.touched && newWorkerForm.controls.phone.errors?.['phoneFormat']) {
                    <p class="text-xs text-destructive">
                      Format Moldova: +373 urmat de 8 cifre (fara spatii).
                    </p>
                  }
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Email (optional)</label>
                  <input type="email" formControlName="email" placeholder="ion.popescu@example.md"
                    class="flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm"
                    [class.border-destructive]="newWorkerForm.controls.email.invalid && newWorkerForm.controls.email.touched"
                    [class.border-input]="!(newWorkerForm.controls.email.invalid && newWorkerForm.controls.email.touched)" />
                  @if (newWorkerForm.controls.email.touched && newWorkerForm.controls.email.errors?.['email']) {
                    <p class="text-xs text-destructive">Format email invalid (ex: nume&#64;domeniu.md).</p>
                  }
                </div>
              </div>

              @if (createError()) {
                <div class="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">{{ createError() }}</div>
              }
            </div>

            <div class="p-6 pt-4 border-t border-foreground/10 flex justify-end gap-2">
              <button type="button" (click)="closeCreate()"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm">
                Anuleaza
              </button>
              <button type="button" (click)="submitCreate()" [disabled]="submittingCreate() || newWorkerForm.invalid"
                class="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                @if (submittingCreate()) { {{ 'common.processing' | t }} } @else { {{ 'worker.list.create' | t }} }
              </button>
            </div>
          </div>
        </div>
      }

      @if (editingWorker(); as w) {
        <app-worker-edit [worker]="w" (closed)="onEditClosed()" (saved)="onEditSaved($event)" />
      }

      @if (confirmWorker(); as w) {
        <app-confirm-dialog
          title="Sterge lucrator"
          [message]="'Sigur stergi lucratorul ' + w.firstName + ' ' + w.lastName + '? Actiunea este ireversibila.'"
          confirmText="Sterge"
          confirmVariant="destructive"
          [submitting]="deletingSubmitting()"
          (confirmed)="onDeleteConfirmed()"
          (cancelled)="confirmWorker.set(null)" />
      }

      @if (toastMessage(); as msg) {
        <div class="fixed bottom-6 right-6 z-[300] rounded-md bg-foreground text-background px-4 py-2 text-sm shadow-lg">
          {{ msg }}
        </div>
      }
    </div>
  `,
})
export class WorkerListComponent implements OnInit {
  private readonly workerDataService = inject(WorkerDataService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);

  protected readonly isInspector = computed(() => this.auth.roleType() === 'Inspector');
  protected readonly openMenuId = signal<string>('');
  protected readonly menuPosition = signal<{ top: number; left: number } | null>(null);
  protected readonly editingWorker = signal<WorkerModel | null>(null);
  protected readonly confirmWorker = signal<WorkerModel | null>(null);
  protected readonly deletingSubmitting = signal<boolean>(false);
  protected readonly toastMessage = signal<string>('');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly workers = signal<WorkerModel[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly offset = signal(0);
  protected readonly limit = signal(25);
  protected readonly Math = Math;

  protected readonly showCreate = signal(false);
  protected readonly submittingCreate = signal(false);
  protected readonly createError = signal('');
  protected readonly todayIso = new Date().toISOString().split('T')[0];

  protected readonly newWorkerForm = this.fb.group({
    lastName: ['', Validators.required],
    firstName: ['', Validators.required],
    idnp: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(13)]],
    birthDate: ['', Validators.required],
    phone: ['', [optionalPhoneValidator]],
    email: ['', [optionalEmailValidator]],
  });

  ngOnInit(): void {
    this.loadWorkers();
  }

  @HostListener('document:click')
  protected onDocumentClick(): void {
    this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMenu();
  }

  protected toggleMenu(id: string, trigger?: EventTarget | null): void {
    if (this.openMenuId() === id) {
      this.closeMenu();
      return;
    }
    if (!(trigger instanceof HTMLElement)) {
      this.openMenuId.set(id);
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const popoverWidth = 200;
    const popoverHeight = 180;
    const flipUp = window.innerHeight - rect.bottom < popoverHeight + 8;
    const top = flipUp ? rect.top - popoverHeight - 4 : rect.bottom + 4;
    const left = Math.max(8, rect.right - popoverWidth);
    this.menuPosition.set({ top, left });
    this.openMenuId.set(id);
  }

  protected closeMenu(): void {
    if (this.openMenuId() !== '') {
      this.openMenuId.set('');
      this.menuPosition.set(null);
    }
  }

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.closeMenu();
  }

  protected onEdit(worker: WorkerModel): void {
    this.closeMenu();
    this.editingWorker.set(worker);
  }

  protected onEditClosed(): void {
    this.editingWorker.set(null);
  }

  protected onEditSaved(_updated: WorkerModel): void {
    this.editingWorker.set(null);
    this.flashToast('Lucrator actualizat');
    this.loadWorkers();
  }

  private flashToast(msg: string): void {
    this.toastMessage.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set('');
      this.toastTimer = null;
    }, 3000);
  }

  protected onDelete(worker: WorkerModel): void {
    this.confirmWorker.set(worker);
  }

  protected onDeleteConfirmed(): void {
    const w = this.confirmWorker();
    if (!w) return;
    this.deletingSubmitting.set(true);
    this.workerDataService.delete(w.id).subscribe({
      next: () => {
        this.deletingSubmitting.set(false);
        this.confirmWorker.set(null);
        this.flashToast('Lucrator sters');
        this.loadWorkers();
      },
      error: () => {
        this.deletingSubmitting.set(false);
        this.confirmWorker.set(null);
        this.flashToast('Eroare la stergerea lucratorului.');
      },
    });
  }

  protected openCreate(): void {
    this.createError.set('');
    this.newWorkerForm.reset();
    this.showCreate.set(true);
  }

  protected closeCreate(): void {
    if (this.submittingCreate()) return;
    this.showCreate.set(false);
  }

  protected submitCreate(): void {
    if (this.newWorkerForm.invalid) {
      this.newWorkerForm.markAllAsTouched();
      return;
    }
    const v = this.newWorkerForm.getRawValue();
    this.submittingCreate.set(true);
    this.createError.set('');
    this.workerDataService.createWorker({
      idnp: v.idnp!,
      firstName: v.firstName!,
      lastName: v.lastName!,
      birthDate: v.birthDate!,
      phone: v.phone?.trim() || undefined,
      email: v.email?.trim() || undefined,
    }).subscribe({
      next: () => {
        this.submittingCreate.set(false);
        this.showCreate.set(false);
        this.offset.set(0);
        this.loadWorkers();
      },
      error: (err) => {
        this.submittingCreate.set(false);
        const errors = err?.error?.errors;
        if (Array.isArray(errors) && errors.length > 0) {
          this.createError.set(errors[0].errorMessage || 'Eroare la salvare.');
        } else if (typeof err?.error?.message === 'string') {
          this.createError.set(err.error.message);
        } else if (err?.status === 409) {
          this.createError.set('Lucrator cu acest IDNP exista deja in registru.');
        } else {
          this.createError.set('Eroare la salvarea lucratorului.');
        }
      },
    });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.offset.set(0);
    this.loadWorkers();
  }

  protected resetFilters(): void {
    this.searchTerm.set('');
    this.offset.set(0);
    this.loadWorkers();
  }

  protected prevPage(): void {
    this.offset.set(Math.max(0, this.offset() - this.limit()));
    this.loadWorkers();
  }

  protected nextPage(): void {
    this.offset.set(this.offset() + this.limit());
    this.loadWorkers();
  }

  private loadWorkers(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean> = {
      offset: this.offset(),
      limit: this.limit(),
    };
    const term = this.searchTerm().trim();
    if (term) {
      params['search'] = term;
    }
    this.workerDataService.getWorkers(params).subscribe({
      next: (result: PaginatedResult<WorkerModel>) => {
        this.workers.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
