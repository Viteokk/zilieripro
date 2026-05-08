import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" (click)="cancel()">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col" (click)="$event.stopPropagation()">
        <div class="p-6 pb-4 border-b border-foreground/10 flex items-start justify-between gap-4">
          <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
          <button type="button" aria-label="Inchide" [disabled]="submitting"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            (click)="cancel()">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6 text-sm text-gray-600">
          {{ message }}
        </div>

        <div class="p-6 pt-4 border-t border-foreground/10 flex justify-end gap-2">
          <button type="button" (click)="cancel()" [disabled]="submitting"
            class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm disabled:opacity-50">
            {{ cancelText }}
          </button>
          <button type="button" (click)="confirm()" [disabled]="submitting"
            [class]="confirmButtonClass"
            class="inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium disabled:opacity-50">
            @if (submitting) {
              <svg class="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v4m0 8v4m8-8h-4M8 12H4m13.657-5.657l-2.828 2.828M9.172 14.828l-2.829 2.829m0-11.314l2.829 2.829m5.656 5.656l2.828 2.828" />
              </svg>
            }
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) message!: string;
  @Input() confirmText = 'Confirma';
  @Input() cancelText = 'Anuleaza';
  @Input() confirmVariant: 'primary' | 'destructive' = 'primary';
  @Input() submitting = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  protected get confirmButtonClass(): string {
    return this.confirmVariant === 'destructive'
      ? 'bg-destructive text-white hover:bg-destructive/90'
      : 'bg-primary text-primary-foreground hover:bg-primary/90';
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cancel();
  }

  protected cancel(): void {
    if (this.submitting) return;
    this.cancelled.emit();
  }

  protected confirm(): void {
    if (this.submitting) return;
    this.confirmed.emit();
  }
}
