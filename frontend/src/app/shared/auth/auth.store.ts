import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { CompanyInfo, UserInfo } from '../models/voucher.model';
import { ApiService } from '../services/api.service';

const TOKEN_KEY = 'ez_token';
const REFRESH_TOKEN_KEY = 'ez_refresh_token';
const SELECTED_COMPANY_KEY = 'ez_selected_company_idno';
const COMPANIES_KEY = 'ez_companies';

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  availableCompanies: CompanyInfo[];
}

function loadInitialState(): AuthState {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const refreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
  const companiesJson = typeof localStorage !== 'undefined' ? localStorage.getItem(COMPANIES_KEY) : null;
  const availableCompanies: CompanyInfo[] = companiesJson ? JSON.parse(companiesJson) : [];
  return {
    user: null,
    token,
    refreshToken,
    loading: false,
    availableCompanies,
  };
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(loadInitialState()),
  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.token() && !!store.user()),
    fullName: computed(() => {
      const user = store.user();
      return user ? `${user.firstName} ${user.lastName}` : '';
    }),
    permissions: computed(() => store.user()?.permissions ?? []),
    roleType: computed(() => store.user()?.roleType ?? null),
  })),
  withMethods((store) => {
    const api = inject(ApiService);
    const router = inject(Router);

    return {
      setUser(user: UserInfo): void {
        patchState(store, { user });
      },

      setToken(token: string, refreshToken: string): void {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        patchState(store, { token, refreshToken });
      },

      clearAuth(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(SELECTED_COMPANY_KEY);
        localStorage.removeItem(COMPANIES_KEY);
        patchState(store, { user: null, token: null, refreshToken: null, availableCompanies: [] });
      },

      async loadUser(): Promise<void> {
        if (!store.token()) return;
        try {
          const user = await firstValueFrom(api.getMe());
          patchState(store, { user });
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          patchState(store, { user: null, token: null, refreshToken: null });
        }
      },

      async logout(): Promise<void> {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(SELECTED_COMPANY_KEY);
        localStorage.removeItem(COMPANIES_KEY);
        patchState(store, { user: null, token: null, refreshToken: null, availableCompanies: [] });
        await router.navigate(['/login']);
      },

      async login(idnp: string, password: string): Promise<void> {
        localStorage.removeItem(SELECTED_COMPANY_KEY);
        patchState(store, { loading: true });
        try {
          const response = await firstValueFrom(api.login(idnp, password));
          const companies = response.availableCompanies ?? [];
          localStorage.setItem(TOKEN_KEY, response.token);
          localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
          localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
          patchState(store, {
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            availableCompanies: companies,
            loading: false,
          });

          if (companies.length > 1) {
            // Multiple companies — show picker
            await router.navigate(['/select-company']);
          } else {
            // Single company — auto-select so auth guard doesn't redirect
            if (response.user.beneficiaryId) {
              localStorage.setItem(SELECTED_COMPANY_KEY, response.user.beneficiaryId);
            }
          }
        } catch (error) {
          patchState(store, { loading: false });
          throw error;
        }
      },

      async switchCompany(beneficiaryId: string): Promise<void> {
        try {
          const response = await firstValueFrom(api.switchCompany(beneficiaryId));
          const companies = response.availableCompanies ?? [];
          localStorage.setItem(TOKEN_KEY, response.token);
          localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
          localStorage.setItem(SELECTED_COMPANY_KEY, beneficiaryId);
          localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
          patchState(store, {
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            availableCompanies: companies,
          });
        } catch (error) {
          throw error;
        }
      },

      hasPermission(permission: string): boolean {
        return store.user()?.permissions.includes(permission) ?? false;
      },
    };
  }),
);
