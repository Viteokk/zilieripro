import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateVoucherRequest,
  PaginatedResult,
  VoucherCreatedSummary,
  VoucherDetail,
  VoucherTableItem,
} from '../../../shared/models/voucher.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VoucherDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vouchers`;

  getVouchers(params: Record<string, string | number | boolean>): Observable<PaginatedResult<VoucherTableItem>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      httpParams = httpParams.set(key, String(value));
    });
    return this.http.get<PaginatedResult<VoucherTableItem>>(this.baseUrl, { params: httpParams });
  }

  getVoucher(id: string): Observable<VoucherDetail> {
    return this.http.get<VoucherDetail>(`${this.baseUrl}/${id}`);
  }

  createVouchers(request: CreateVoucherRequest): Observable<VoucherCreatedSummary> {
    return this.http.post<VoucherCreatedSummary>(this.baseUrl, request);
  }

  editVoucher(id: string, request: Partial<VoucherDetail>): Observable<VoucherDetail> {
    return this.http.put<VoucherDetail>(`${this.baseUrl}/${id}`, request);
  }

  activateVoucher(id: string): Observable<VoucherDetail> {
    return this.http.post<VoucherDetail>(`${this.baseUrl}/${id}/activate`, {});
  }

  executeVoucher(id: string): Observable<VoucherDetail> {
    return this.http.post<VoucherDetail>(`${this.baseUrl}/${id}/execute`, {});
  }

  reportVoucher(id: string, reportPeriod: string): Observable<VoucherDetail> {
    return this.http.post<VoucherDetail>(`${this.baseUrl}/${id}/report`, JSON.stringify(reportPeriod), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  cancelVoucher(id: string, request: { reasonCode: string; cancellationDate: string; note?: string }): Observable<VoucherDetail> {
    return this.http.post<VoucherDetail>(`${this.baseUrl}/${id}/cancel`, request);
  }

  signVoucher(id: string, signatureDataUrl: string): Observable<VoucherDetail> {
    return this.http.post<VoucherDetail>(`${this.baseUrl}/${id}/sign`, { signatureDataUrl });
  }
}
