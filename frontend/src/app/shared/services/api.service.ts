import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BeneficiaryModel,
  CreateBeneficiaryRequest,
  CreateVoucherRequest,
  CreateWorkerRequest,
  LoginResponse,
  NomenclatorModel,
  PaginatedResult,
  StatisticsModel,
  UserInfo,
  UserTableItem,
  VoucherActivityItem,
  VoucherCreatedSummary,
  VoucherDetail,
  VoucherTableItem,
  WorkerModel,
} from '../models/voucher.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // --------------- Generic HTTP methods ---------------

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, String(value));
      });
    }
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  post<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  patch<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`);
  }

  // --------------- Reports ---------------

  exportIpc21Pdf(period: string, beneficiaryId?: string): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.baseUrl}/reports/ipc21/export`,
      { period, beneficiaryId },
      { responseType: 'blob', observe: 'response' });
  }

  // --------------- Auth ---------------

  login(idnp: string, password: string): Observable<LoginResponse> {
    return this.post<LoginResponse>('/accounts/login', { idnp, password });
  }

  getMe(): Observable<UserInfo> {
    return this.get<UserInfo>('/accounts/me');
  }

  refreshToken(refreshToken: string): Observable<LoginResponse> {
    return this.post<LoginResponse>('/accounts/refresh', { refreshToken });
  }

  switchCompany(beneficiaryId: string): Observable<LoginResponse> {
    return this.post<LoginResponse>('/accounts/switch-company', { beneficiaryId });
  }

  // --------------- Vouchers ---------------

  getVouchers(params?: Record<string, string | number | boolean>): Observable<PaginatedResult<VoucherTableItem>> {
    return this.get<PaginatedResult<VoucherTableItem>>('/vouchers', params);
  }

  getVoucher(id: string): Observable<VoucherDetail> {
    return this.get<VoucherDetail>(`/vouchers/${id}`);
  }

  createVouchers(request: CreateVoucherRequest): Observable<VoucherCreatedSummary> {
    return this.post<VoucherCreatedSummary>('/vouchers', request);
  }

  activateVoucher(id: string): Observable<VoucherDetail> {
    return this.patch<VoucherDetail>(`/vouchers/${id}/activate`, {});
  }

  executeVoucher(id: string): Observable<VoucherDetail> {
    return this.patch<VoucherDetail>(`/vouchers/${id}/execute`, {});
  }

  cancelVoucher(id: string, reasonCode: string, note?: string): Observable<VoucherDetail> {
    return this.patch<VoucherDetail>(`/vouchers/${id}/cancel`, { reasonCode, note });
  }

  reportVouchers(voucherIds: string[], reportPeriod: string): Observable<void> {
    return this.post<void>('/vouchers/report', { voucherIds, reportPeriod });
  }

  getVoucherActivity(id: string): Observable<VoucherActivityItem[]> {
    return this.get<VoucherActivityItem[]>(`/vouchers/${id}/activity`);
  }

  // --------------- Workers ---------------

  getWorkers(params?: Record<string, string | number | boolean>): Observable<PaginatedResult<WorkerModel>> {
    return this.get<PaginatedResult<WorkerModel>>('/workers', params);
  }

  getWorker(id: string): Observable<WorkerModel> {
    return this.get<WorkerModel>(`/workers/${id}`);
  }

  validateWorkerRsp(idnp: string): Observable<WorkerModel> {
    return this.post<WorkerModel>('/workers/validate-rsp', { idnp });
  }

  createWorker(request: CreateWorkerRequest): Observable<WorkerModel> {
    return this.post<WorkerModel>('/workers', request);
  }

  updateWorker(id: string, request: { phone: string | null; email: string | null }): Observable<WorkerModel> {
    return this.put<WorkerModel>(`/workers/${id}`, request);
  }

  updateWorkerStatus(id: string, isActive: boolean): Observable<WorkerModel> {
    return this.patch<WorkerModel>(`/workers/${id}/status`, { isActive });
  }

  // --------------- Beneficiaries ---------------

  getBeneficiaries(params?: Record<string, string | number | boolean>): Observable<PaginatedResult<BeneficiaryModel>> {
    return this.get<PaginatedResult<BeneficiaryModel>>('/beneficiaries', params);
  }

  getBeneficiary(id: string): Observable<BeneficiaryModel> {
    return this.get<BeneficiaryModel>(`/beneficiaries/${id}`);
  }

  createBeneficiary(req: CreateBeneficiaryRequest): Observable<BeneficiaryModel> {
    return this.post<BeneficiaryModel>('/beneficiaries', req);
  }

  linkUserToBeneficiary(beneficiaryId: string, idnp: string): Observable<void> {
    return this.post<void>(`/beneficiaries/${beneficiaryId}/link-user`, { idnp });
  }

  // --------------- Users ---------------

  getUsers(params?: Record<string, string | number | boolean>): Observable<PaginatedResult<UserTableItem>> {
    return this.get<PaginatedResult<UserTableItem>>('/users', params);
  }

  getUser(id: string): Observable<UserTableItem> {
    return this.get<UserTableItem>(`/users/${id}`);
  }

  createUser(body: Partial<UserTableItem> & { password: string }): Observable<UserTableItem> {
    return this.post<UserTableItem>('/users', body);
  }

  updateUser(id: string, body: Partial<UserTableItem>): Observable<UserTableItem> {
    return this.put<UserTableItem>(`/users/${id}`, body);
  }

  blockUser(id: string): Observable<void> {
    return this.patch<void>(`/users/${id}/block`, {});
  }

  deleteUser(id: string): Observable<void> {
    return this.delete<void>(`/users/${id}`);
  }

  // --------------- Statistics ---------------

  getStatistics(params?: Record<string, string | number | boolean>): Observable<StatisticsModel> {
    return this.get<StatisticsModel>('/statistics', params);
  }

  // --------------- Nomenclators ---------------

  getNomenclators(category: string): Observable<NomenclatorModel[]> {
    return this.get<NomenclatorModel[]>('/nomenclators', { category });
  }
}
