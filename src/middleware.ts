import { defineMiddleware } from 'astro:middleware';
import { getLocaleFromAcceptLanguage } from './i18n';

const SUPPORTED_LOCALES = ['en', 'zh', 'th'] as const;

export const onRequest = defineMiddleware((context, next) => {
  const pathname = context.url.pathname;

  // API routes: set default locale so Locals is always defined
  if (pathname.startsWith('/api/')) {
    context.locals.locale = 'en';
    return next();
  }

  const segments = pathname.slice(1).split('/').filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();

  if (firstSegment && SUPPORTED_LOCALES.includes(firstSegment as (typeof SUPPORTED_LOCALES)[number])) {
    context.locals.locale = firstSegment as (typeof SUPPORTED_LOCALES)[number];
  } else {
    const acceptLanguage = context.request.headers.get('Accept-Language');
    context.locals.locale = getLocaleFromAcceptLanguage(acceptLanguage);
  }

  return next();
});
