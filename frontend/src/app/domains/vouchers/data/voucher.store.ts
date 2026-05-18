import { computed, Injectable, signal } from '@angular/core';

export interface VoucherQueryState {
  offset: number;
  limit: number;
  status: string;
  workerIdnp: string;
  code: string;
  dateFrom: string;
  dateTo: string;
  district: string;
  locality: string;
  beneficiaryId: string;
  sortBy: string;
  sortDesc: boolean;
}

const initialState: VoucherQueryState = {
  offset: 0,
  limit: 20,
  status: '',
  workerIdnp: '',
  code: '',
  dateFrom: '',
  dateTo: '',
  district: '',
  locality: '',
  beneficiaryId: '',
  sortBy: 'createdAt',
  sortDesc: true,
};

@Injectable({ providedIn: 'root' })
export class VoucherStore {
  private readonly _state = signal<VoucherQueryState>({ ...initialState });

  readonly state = this._state.asReadonly();

  readonly queryParams = computed(() => {
    const s = this._state();
    const params: Record<string, string | number | boolean> = {
      offset: s.offset,
      limit: s.limit,
      sortBy: s.sortBy,
      sortDesc: s.sortDesc,
    };
    if (s.status) params['status'] = s.status;
    if (s.workerIdnp) params['workerIdnp'] = s.workerIdnp;
    if (s.code) params['code'] = s.code;
    if (s.dateFrom) params['dateFrom'] = s.dateFrom;
    if (s.dateTo) params['dateTo'] = s.dateTo;
    if (s.district) params['district'] = s.district;
    if (s.locality) params['locality'] = s.locality;
    if (s.beneficiaryId) params['beneficiaryId'] = s.beneficiaryId;
    return params;
  });

  setQuery(partial: Partial<VoucherQueryState>): void {
    this._state.update((current) => ({ ...current, ...partial }));
  }

  resetQuery(): void {
    this._state.set({ ...initialState });
  }
}
