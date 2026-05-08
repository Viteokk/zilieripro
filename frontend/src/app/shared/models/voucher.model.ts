export type VoucherStatus = 'Emis' | 'Activ' | 'Executat' | 'Raportat' | 'Anulat';
export type CancellationReasonCode = 'CA01' | 'CA02' | 'CA03';
export type RoleType = 'Angajator' | 'Inspector' | 'Administrator' | 'Zilier';

export interface VoucherTableItem {
  id: string;
  code: string;
  status: VoucherStatus;
  workDate: string;
  hoursWorked: number;
  netRemuneration: number;
  grossRemuneration: number;
  workerIdnp: string;
  workerFullName: string;
  beneficiaryName?: string;
  workDistrict: string;
  createdAt: string;
}

export interface VoucherDetail {
  id: string;
  code: string;
  status: VoucherStatus;
  workDate: string;
  hoursWorked: number;
  netRemuneration: number;
  incomeTax: number;
  cnasContribution: number;
  grossRemuneration: number;
  workDistrict: string;
  workLocality: string;
  workAddress?: string;
  activityType?: string;
  rspValidated: boolean;
  art5Alin1LitB: boolean;
  art5Alin1LitG: boolean;
  cancellationReason?: CancellationReasonCode;
  cancellationNote?: string;
  cancellationDate?: string;
  activatedAt?: string;
  executedAt?: string;
  reportedAt?: string;
  reportPeriod?: string;
  createdAt: string;
  signatureDataUrl?: string;
  signedAt?: string;
  worker: WorkerModel;
  beneficiary: BeneficiaryModel;
}

export interface WorkerModel {
  id: string;
  idnp: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone?: string;
  email?: string;
  rspValidated: boolean;
  rspValidatedAt?: string;
  rspErrorMessage?: string;
  isActive: boolean;
  voucherCount?: number;
  createdAt?: string;
}

export interface BeneficiaryModel {
  id: string;
  idno: string;
  companyName: string;
  legalForm?: string;
  activityType?: string;
  address?: string;
  district?: string;
  locality?: string;
  phone?: string;
  email?: string;
  workerCount?: number;
  voucherCount?: number;
  createdAt?: string;
}

export interface CreateVoucherRequest {
  workDate: string;
  hoursWorked: number;
  workDistrict: string;
  workLocality: string;
  workAddress?: string;
  activityType?: string;
  art5Alin1LitB: boolean;
  art5Alin1LitG: boolean;
  workers: VoucherWorkerRequest[];
}

export interface VoucherWorkerRequest {
  idnp: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  netRemuneration: number;
  phone?: string;
  email?: string;
}

export interface CreateWorkerRequest {
  idnp: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone?: string;
  email?: string;
}

export interface VoucherCreatedSummary {
  totalVouchers: number;
  totalNet: number;
  totalGross: number;
  totalTax: number;
  totalCnas: number;
  vouchers: VoucherTableItem[];
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  offset: number;
  limit: number;
}

export interface UserInfo {
  id: string;
  idnp: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  roleType: RoleType;
  beneficiaryId?: string;
  beneficiaryName?: string;
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}

export interface UserTableItem {
  id: string;
  idnp: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  roleName: string;
  status: 'Active' | 'Blocked' | 'Deleted';
  createdAt: string;
}

export interface StatisticsModel {
  totalVouchers: number;
  totalWorkers: number;
  totalBeneficiaries: number;
  totalNetRemuneration: number;
  totalGrossRemuneration: number;
  totalTaxCollected: number;
  vouchersByStatus: Record<string, number>;
  vouchersByDistrict: Record<string, number>;
  remunerationByMonth: Record<string, number>;
}

export interface NomenclatorModel {
  id: string;
  category: string;
  code: string;
  titleRo: string;
  titleRu?: string;
  titleEn?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface VoucherActivityItem {
  actionLabel: string;
  userFullName: string | null;
  timestamp: string;
  changes?: string[];
}
