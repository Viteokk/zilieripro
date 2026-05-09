import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { PaginatedResult, UserTableItem } from '../../../shared/models/voucher.model';
import { MaskIdnpPipe } from '../../../shared/pipes/mask-idnp.pipe';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [FormsModule, RouterLink, MaskIdnpPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col gap-4 md:flex-row md:items-center mb-6">
        <div class="w-full md:mr-4 md:w-auto">
          <h1 class="text-3xl font-bold tracking-tight text-foreground scroll-m-20">Gestionare utilizatori</h1>
        </div>
        <div class="w-full md:ml-auto md:w-auto">
          <a
            routerLink="/admin/users/create"
            class="inline-flex h-9 w-full justify-center md:w-auto md:justify-start shrink-0 items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90"
          >
            + Adauga utilizator
          </a>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">Rol</label>
            <select
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              [ngModel]="filterRole()"
              (ngModelChange)="onRoleChange($event)"
            >
              <option value="">Toate</option>
              <option value="Angajator">Angajator</option>
              <option value="Inspector">Inspector</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none select-none">Status</label>
            <select
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              [ngModel]="filterStatus()"
              (ngModelChange)="onStatusChange($event)"
            >
              <option value="">Toate</option>
              <option value="Active">Active</option>
              <option value="Blocked">Blocked</option>
              <option value="Deleted">Deleted</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              class="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              (click)="resetFilters()"
            >
              Resetare filtre
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full caption-bottom text-sm">
            <thead class="[&_tr]:border-b [&_tr]:border-foreground/10">
              <tr>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">IDNP</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Nume</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Prenume</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Email</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Rol</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Status</th>
                <th class="text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap">Actiuni</th>
              </tr>
            </thead>
            <tbody class="[&_tr:last-child]:border-0">
              @for (user of users(); track user.id) {
                <tr class="hover:bg-muted/50 border-b border-foreground/5 transition-colors">
                  <td class="p-2 align-middle whitespace-nowrap font-mono text-foreground/80">{{ user.idnp | maskIdnp }}</td>
                  <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ user.lastName }}</td>
                  <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ user.firstName }}</td>
                  <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ user.email ?? '-' }}</td>
                  <td class="p-2 align-middle whitespace-nowrap text-foreground/80">{{ user.roleName }}</td>
                  <td class="p-2 align-middle whitespace-nowrap">
                    <span [class]="'inline-flex h-5 items-center rounded-4xl px-2 py-0.5 text-xs font-medium ' + statusClass(user.status)">
                      {{ user.status }}
                    </span>
                  </td>
                  <td class="p-2 align-middle whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <a
                        [routerLink]="['/admin/users', user.id]"
                        class="inline-flex h-6 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium border border-input bg-background shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
                      >
                        Vizualizeaza
                      </a>
                      @if (user.status === 'Active') {
                        <button
                          class="inline-flex h-6 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium border border-input bg-background shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
                          (click)="toggleBlock(user)"
                        >
                          Blocheaza
                        </button>
                      }
                      @if (user.status === 'Blocked') {
                        <button
                          class="inline-flex h-6 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium border border-input bg-background shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
                          (click)="toggleBlock(user)"
                        >
                          Activeaza
                        </button>
                      }
                      @if (user.status !== 'Deleted') {
                        <button
                          class="inline-flex h-6 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium bg-destructive text-white shadow-xs transition-all hover:bg-destructive/90"
                          (click)="deleteUser(user)"
                        >
                          Sterge
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="p-2 align-middle whitespace-nowrap py-8 text-center text-muted-foreground">
                    Nu au fost gasiti utilizatori.
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
    </div>
  `,
})
export class UserListComponent implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly users = signal<UserTableItem[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly filterRole = signal('');
  protected readonly filterStatus = signal('');
  protected readonly offset = signal(0);
  protected readonly limit = signal(20);
  protected readonly Math = Math;

  ngOnInit(): void {
    this.loadUsers();
  }

  protected onRoleChange(role: string): void {
    this.filterRole.set(role);
    this.offset.set(0);
    this.loadUsers();
  }

  protected onStatusChange(status: string): void {
    this.filterStatus.set(status);
    this.offset.set(0);
    this.loadUsers();
  }

  protected resetFilters(): void {
    this.filterRole.set('');
    this.filterStatus.set('');
    this.offset.set(0);
    this.loadUsers();
  }

  protected prevPage(): void {
    this.offset.set(Math.max(0, this.offset() - this.limit()));
    this.loadUsers();
  }

  protected nextPage(): void {
    this.offset.set(this.offset() + this.limit());
    this.loadUsers();
  }

  protected toggleBlock(user: UserTableItem): void {
    this.api.blockUser(user.id).subscribe(() => this.loadUsers());
  }

  protected deleteUser(user: UserTableItem): void {
    if (confirm(`Sigur doriti sa stergeti utilizatorul ${user.lastName} ${user.firstName}?`)) {
      this.api.deleteUser(user.id).subscribe(() => this.loadUsers());
    }
  }

  protected statusClass(status: string): string {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Blocked': return 'bg-red-100 text-red-800';
      case 'Deleted': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  private loadUsers(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean> = {
      offset: this.offset(),
      limit: this.limit(),
    };
    if (this.filterRole()) {
      params['role'] = this.filterRole();
    }
    if (this.filterStatus()) {
      params['status'] = this.filterStatus();
    }
    this.api.getUsers(params).subscribe({
      next: (result: PaginatedResult<UserTableItem>) => {
        this.users.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
