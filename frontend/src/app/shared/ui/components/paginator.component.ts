import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export interface PageChangeEvent {
  offset: number;
  limit: number;
}

@Component({
  selector: 'app-paginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <!-- Rows per page — hidden on mobile -->
      <div class="hidden sm:flex items-center gap-2 text-sm text-gray-700">
        <span>Rânduri per pagină:</span>
        <select
          [value]="limit()"
          (change)="onPageSizeChange($event)"
          class="rounded border border-gray-300 text-sm px-1 py-0.5"
        >
          @for (size of pageSizeOptions; track size) {
            <option [value]="size">{{ size }}</option>
          }
        </select>
      </div>

      <!-- Range info -->
      <div class="flex items-center justify-center gap-2 text-sm text-gray-700">
        <span>{{ rangeStart() }}–{{ rangeEnd() }} din {{ totalCount() }}</span>
      </div>

      <!-- Navigation -->
      <div class="flex items-center justify-center gap-1">
        <button type="button" [disabled]="currentPage() === 1" (click)="goToPage(1)"
          class="hidden sm:inline-flex rounded px-2 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation">
          «
        </button>
        <button type="button" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium
                 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation">
          ‹
        </button>
        <span class="px-3 text-sm font-medium">
          {{ currentPage() }} / {{ totalPages() }}
        </span>
        <button type="button" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium
                 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation">
          ›
        </button>
        <button type="button" [disabled]="currentPage() === totalPages()" (click)="goToPage(totalPages())"
          class="hidden sm:inline-flex rounded px-2 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation">
          »
        </button>
      </div>
    </div>
  `,
})
export class PaginatorComponent {
  offset = input.required<number>();
  limit = input.required<number>();
  totalCount = input.required<number>();

  pageChange = output<PageChangeEvent>();

  readonly pageSizeOptions = [10, 25, 50, 100];

  protected currentPage = computed(() => Math.floor(this.offset() / this.limit()) + 1);

  protected totalPages = computed(() => {
    const total = this.totalCount();
    const lim = this.limit();
    return total === 0 ? 1 : Math.ceil(total / lim);
  });

  protected rangeStart = computed(() => {
    return this.totalCount() === 0 ? 0 : this.offset() + 1;
  });

  protected rangeEnd = computed(() => {
    return Math.min(this.offset() + this.limit(), this.totalCount());
  });

  goToPage(page: number): void {
    const newOffset = (page - 1) * this.limit();
    this.pageChange.emit({ offset: newOffset, limit: this.limit() });
  }

  onPageSizeChange(event: Event): void {
    const newLimit = Number((event.target as HTMLSelectElement).value);
    this.pageChange.emit({ offset: 0, limit: newLimit });
  }
}
