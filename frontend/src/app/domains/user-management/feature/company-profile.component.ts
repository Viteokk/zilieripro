import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthStore } from '../../../shared/auth/auth.store';
import { ApiService } from '../../../shared/services/api.service';
import { UserTableItem } from '../../../shared/models/voucher.model';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { MaskIdnpPipe } from '../../../shared/pipes/mask-idnp.pipe';

interface CompanyInfo {
  idno: string;
  name: string;
  legalForm: string;
  activityType: string;
  address: string;
}

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [TranslatePipe, MaskIdnpPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">{{ 'company.title' | t }}</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ 'company.subtitle' | t }}</p>
      </div>

      <!-- Company card -->
      <div class="bg-card rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{{ 'company.dataSection' | t }}</h2>
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div class="flex justify-between items-start border-b border-foreground/5 pb-2">
            <dt class="text-sm text-muted-foreground">{{ 'field.idno' | t }}</dt>
            <dd class="text-sm font-medium font-mono text-foreground">{{ company().idno }}</dd>
          </div>
          <div class="flex justify-between items-start border-b border-foreground/5 pb-2">
            <dt class="text-sm text-muted-foreground">{{ 'field.companyName' | t }}</dt>
            <dd class="text-sm font-medium text-foreground text-right">{{ company().name }}</dd>
          </div>
          <div class="flex justify-between items-start border-b border-foreground/5 pb-2">
            <dt class="text-sm text-muted-foreground">{{ 'field.legalForm' | t }}</dt>
            <dd class="text-sm font-medium text-foreground">{{ company().legalForm }}</dd>
          </div>
          <div class="flex justify-between items-start border-b border-foreground/5 pb-2">
            <dt class="text-sm text-muted-foreground">{{ 'field.activityType' | t }}</dt>
            <dd class="text-sm font-medium text-foreground">{{ company().activityType }}</dd>
          </div>
          <div class="flex justify-between items-start md:col-span-2">
            <dt class="text-sm text-muted-foreground">{{ 'field.address' | t }}</dt>
            <dd class="text-sm font-medium text-foreground text-right">{{ company().address }}</dd>
          </div>
        </dl>
      </div>

      <!-- User accounts -->
      <div class="bg-card rounded-xl ring-1 ring-foreground/10 shadow-xs p-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-foreground">{{ 'company.users' | t }}</h2>
            <p class="text-sm text-muted-foreground">{{ 'company.usersHint' | t }}</p>
          </div>
          <button type="button" (click)="openAddUser()"
            class="inline-flex h-9 items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-semibold hover:bg-primary/90">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            {{ 'company.addUser' | t }}
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="border-b border-foreground/10">
              <tr class="text-muted-foreground">
                <th class="h-10 px-3 text-start align-middle font-medium text-xs uppercase tracking-wide">{{ 'field.idnp' | t }}</th>
                <th class="h-10 px-3 text-start align-middle font-medium text-xs uppercase tracking-wide">{{ 'field.lastName' | t }}</th>
                <th class="h-10 px-3 text-start align-middle font-medium text-xs uppercase tracking-wide">{{ 'field.firstName' | t }}</th>
                <th class="h-10 px-3 text-start align-middle font-medium text-xs uppercase tracking-wide">{{ 'field.jobTitle' | t }}</th>
                <th class="h-10 px-3 text-start align-middle font-medium text-xs uppercase tracking-wide">{{ 'common.status' | t }}</th>
                <th class="h-10 px-3 text-start align-middle font-medium text-xs uppercase tracking-wide">{{ 'common.actions' | t }}</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <tr><td colspan="6" class="p-6 text-center text-muted-foreground">Se incarca...</td></tr>
              } @else if (users().length === 0) {
                <tr><td colspan="6" class="p-6 text-center text-muted-foreground">Niciun utilizator adaugat.</td></tr>
              } @else {
                @for (u of users(); track u.id) {
                  <tr class="border-b border-foreground/5 hover:bg-muted/30 transition-colors">
                    <td class="px-3 py-3 font-mono text-xs text-foreground/80">{{ u.idnp | maskIdnp }}</td>
                    <td class="px-3 py-3 font-medium text-foreground">{{ u.lastName }}</td>
                    <td class="px-3 py-3 font-medium text-foreground">{{ u.firstName }}</td>
                    <td class="px-3 py-3 text-foreground/80">{{ u.jobTitle }}</td>
                    <td class="px-3 py-3">
                      <span [class]="'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + statusPill(u.status)">
                        {{ statusLabel(u.status) }}
                      </span>
                    </td>
                    <td class="px-3 py-3">
                      @if (isAdminUser(u)) {
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">Administrator</span>
                      } @else {
                        <div class="flex items-center gap-2">
                          <button type="button" (click)="editUser(u)" class="size-8 inline-flex items-center justify-center rounded-md hover:bg-accent" title="Editeaza">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                          </button>
                          @if (u.status === 'Blocked') {
                            <button type="button" (click)="toggleBlock(u)" class="size-8 inline-flex items-center justify-center rounded-md hover:bg-green-500/10 text-green-600" title="Deblocheaza">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                            </button>
                          } @else {
                            <button type="button" (click)="toggleBlock(u)" class="size-8 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive" title="Blocheaza">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </button>
                          }
                        </div>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add user modal -->
      @if (addUserOpen()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" (click)="addUserOpen.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold mb-1">Adauga utilizator</h3>
            <p class="text-sm text-muted-foreground mb-4">Datele vor fi validate prin MConnect.</p>
            <div class="space-y-3">
              <div class="space-y-1.5">
                <label class="text-xs text-muted-foreground">IDNP *</label>
                <input type="text" maxlength="13" [value]="newUser().idnp" (input)="updateNewUser('idnp', $any($event.target).value)"
                  class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Nume *</label>
                  <input type="text" [value]="newUser().lastName" (input)="updateNewUser('lastName', $any($event.target).value)"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground">Prenume *</label>
                  <input type="text" [value]="newUser().firstName" (input)="updateNewUser('firstName', $any($event.target).value)"
                    class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs text-muted-foreground">Email *</label>
                <input type="email" [value]="newUser().email" (input)="updateNewUser('email', $any($event.target).value)"
                  class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs text-muted-foreground">Telefon</label>
                <input type="tel" [value]="newUser().phone" (input)="updateNewUser('phone', $any($event.target).value)"
                  class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs text-muted-foreground">Functie *</label>
                <input type="text" [value]="newUser().jobTitle" (input)="updateNewUser('jobTitle', $any($event.target).value)"
                  class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" placeholder="ex: Contabil, Director..." />
              </div>
            </div>
            @if (addUserError()) {
              <div class="mt-3 p-2.5 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive">{{ addUserError() }}</div>
            }
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" (click)="addUserOpen.set(false)" [disabled]="addUserSubmitting()"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm disabled:opacity-50">Anuleaza</button>
              <button type="button" (click)="saveNewUser()" [disabled]="addUserSubmitting()"
                class="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                @if (addUserSubmitting()) { Se salveaza... } @else { Salveaza }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Edit user modal -->
      @if (showEditModal()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" (click)="showEditModal.set(false)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold mb-4">Editeaza utilizator</h3>
            <div class="space-y-3">
              <div class="space-y-1.5">
                <label class="text-xs text-muted-foreground">Functie *</label>
                <input type="text" [value]="editingUser()?.jobTitle ?? ''"
                  (input)="updateEditingUser('jobTitle', $any($event.target).value)"
                  class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" placeholder="ex: Contabil, Director..." />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs text-muted-foreground">Telefon</label>
                <input type="tel" [value]="editingUser()?.phone ?? ''"
                  (input)="updateEditingUser('phone', $any($event.target).value)"
                  class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
              </div>
            </div>
            @if (editUserError()) {
              <div class="mt-3 p-2.5 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive">{{ editUserError() }}</div>
            }
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" (click)="showEditModal.set(false)" [disabled]="editUserSubmitting()"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm disabled:opacity-50">Anuleaza</button>
              <button type="button" (click)="saveEditUser()" [disabled]="editUserSubmitting()"
                class="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                @if (editUserSubmitting()) { Se salveaza... } @else { Salveaza }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CompanyProfileComponent implements OnInit {
  private readonly auth = inject(AuthStore);
  private readonly api = inject(ApiService);

  protected readonly loading = signal(true);
  protected readonly users = signal<UserTableItem[]>([]);
  protected readonly addUserOpen = signal(false);
  protected readonly addUserError = signal('');
  protected readonly addUserSubmitting = signal(false);
  protected readonly newUser = signal({ idnp: '', firstName: '', lastName: '', email: '', phone: '', jobTitle: '' });

  protected readonly editingUser = signal<{ id: string; jobTitle: string; phone: string } | null>(null);
  protected readonly showEditModal = signal(false);
  protected readonly editUserSubmitting = signal(false);
  protected readonly editUserError = signal('');

  private static readonly ANGAJATOR_ROLE_ID = 'a1000000-0000-0000-0000-000000000001';

  protected readonly company = computed<CompanyInfo>(() => {
    const u = this.auth.user();
    return {
      idno: '1025600012345',
      name: u?.beneficiaryName ?? 'SRL AgriSud',
      legalForm: 'SRL',
      activityType: 'Agricultura',
      address: 'mun. Chisinau, str. Calea Iesilor 25',
    };
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.api.getUsers({ offset: 0, limit: 100 }).subscribe({
      next: (r) => {
        this.users.set(r.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected isAdminUser(u: UserTableItem): boolean {
    return u.idnp === this.auth.user()?.idnp;
  }

  protected statusPill(status: string): string {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Blocked': return 'bg-red-100 text-red-700';
      case 'Deleted': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  protected statusLabel(status: string): string {
    switch (status) {
      case 'Active': return 'Activ';
      case 'Blocked': return 'Blocat';
      case 'Deleted': return 'Sters';
      default: return status;
    }
  }

  protected editUser(u: UserTableItem): void {
    this.editingUser.set({ id: u.id, jobTitle: u.jobTitle ?? '', phone: u.phone ?? '' });
    this.editUserError.set('');
    this.showEditModal.set(true);
  }

  protected updateEditingUser(key: string, value: string): void {
    this.editingUser.update((eu) => eu ? { ...eu, [key]: value } : eu);
  }

  protected saveEditUser(): void {
    this.editUserError.set('');
    const eu = this.editingUser();
    if (!eu || !eu.jobTitle.trim()) {
      this.editUserError.set('Functia este obligatorie.');
      return;
    }
    this.editUserSubmitting.set(true);
    this.api.updateUser(eu.id, { jobTitle: eu.jobTitle.trim(), phone: eu.phone || undefined } as any).subscribe({
      next: () => {
        this.editUserSubmitting.set(false);
        this.showEditModal.set(false);
        this.loadUsers();
      },
      error: () => this.editUserSubmitting.set(false),
    });
  }

  protected toggleBlock(u: UserTableItem): void {
    if (u.status === 'Blocked') {
      return;
    }
    this.api.blockUser(u.id).subscribe({ next: () => this.loadUsers() });
  }

  protected openAddUser(): void {
    this.newUser.set({ idnp: '', firstName: '', lastName: '', email: '', phone: '', jobTitle: '' });
    this.addUserError.set('');
    this.addUserOpen.set(true);
  }

  protected updateNewUser(key: string, value: string): void {
    this.newUser.update((u) => ({ ...u, [key]: value }));
  }

  protected saveNewUser(): void {
    this.addUserError.set('');
    const u = this.newUser();
    if (!u.idnp || u.idnp.length !== 13) {
      this.addUserError.set('IDNP-ul trebuie sa contina exact 13 cifre.');
      return;
    }
    if (!u.lastName.trim() || !u.firstName.trim()) {
      this.addUserError.set('Numele si prenumele sunt obligatorii.');
      return;
    }
    if (!u.email.trim()) {
      this.addUserError.set('Email-ul este obligatoriu.');
      return;
    }
    if (!u.jobTitle.trim()) {
      this.addUserError.set('Functia este obligatorie.');
      return;
    }
    const beneficiaryId = this.auth.user()?.beneficiaryId;
    if (!beneficiaryId) {
      this.addUserError.set('Nicio companie selectata in sesiune. Reautentificati-va.');
      return;
    }
    this.addUserSubmitting.set(true);
    this.api.createUser({
      idnp: u.idnp,
      firstName: u.firstName.trim(),
      lastName: u.lastName.trim(),
      email: u.email.trim(),
      phone: u.phone || undefined,
      jobTitle: u.jobTitle.trim(),
      roleId: CompanyProfileComponent.ANGAJATOR_ROLE_ID,
      beneficiaryId,
      password: 'TempPass123!',
    } as any).subscribe({
      next: () => {
        this.addUserSubmitting.set(false);
        this.addUserOpen.set(false);
        this.loadUsers();
      },
      error: (err) => {
        this.addUserSubmitting.set(false);
        const fieldErr = err?.error?.errors;
        const msg = (fieldErr && Object.values(fieldErr).flat()[0])
          || err?.error?.message
          || (err?.status === 409 ? 'Un utilizator cu acest IDNP exista deja.' : '')
          || (err?.status === 400 ? 'Datele introduse nu sunt valide.' : '')
          || 'Eroare la salvarea utilizatorului. Incercati din nou.';
        this.addUserError.set(String(msg));
      },
    });
  }
}
