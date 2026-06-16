import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from './auth.store';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  // Nu adăuga token pentru request-urile către Strapi CMS
  if (environment.strapiUrl && req.url.startsWith(environment.strapiUrl)) {
    return next(req);
  }

  const authStore = inject(AuthStore);
  const token = authStore.token();

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned);
  }

  return next(req);
};
