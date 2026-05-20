'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type AuthAnalyticsEventName = 'signup_complete' | 'login_success';

type WindowWithDataLayer = Window & {
  dataLayer?: Object[];
};

function isAuthAnalyticsEvent(value: string | null): value is AuthAnalyticsEventName {
  return value === 'signup_complete' || value === 'login_success';
}

function pushAuthAnalyticsEvent({
  event,
  method,
  authFlow,
  pagePath
}: {
  event: AuthAnalyticsEventName;
  method: string;
  authFlow: string;
  pagePath: string;
}) {
  if (typeof window === 'undefined') return;

  const windowWithDataLayer = window as WindowWithDataLayer;
  windowWithDataLayer.dataLayer = windowWithDataLayer.dataLayer || [];

  windowWithDataLayer.dataLayer.push({
    event,
    method,
    auth_flow: authFlow,
    page_path: pagePath
  });
}

export default function AuthAnalyticsBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authEvent = searchParams.get('auth_event');

    if (!isAuthAnalyticsEvent(authEvent)) {
      return;
    }

    const method = searchParams.get('auth_method') || 'unknown';
    const authFlow = searchParams.get('auth_flow') || method;
    const authMarker = searchParams.get('auth_marker') || `${authEvent}_${method}_${pathname}`;
    const storageKey = `tutovera_auth_event_tracked_${authMarker}`;

    try {
      if (window.sessionStorage.getItem(storageKey) !== 'true') {
        pushAuthAnalyticsEvent({
          event: authEvent,
          method,
          authFlow,
          pagePath: pathname
        });

        window.sessionStorage.setItem(storageKey, 'true');
      }
    } catch {
      pushAuthAnalyticsEvent({
        event: authEvent,
        method,
        authFlow,
        pagePath: pathname
      });
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('auth_event');
    nextParams.delete('auth_method');
    nextParams.delete('auth_flow');
    nextParams.delete('auth_marker');

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}