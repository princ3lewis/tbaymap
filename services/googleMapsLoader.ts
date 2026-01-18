let googleMapsPromise: Promise<any> | null = null;

const MAPS_CALLBACK_NAME = '__tbayMapsInit';

const buildGoogleMapsUrl = (apiKey: string, libraries: string[]) => {
  const params = new URLSearchParams({
    key: apiKey,
    v: 'weekly',
    loading: 'async',
    callback: MAPS_CALLBACK_NAME
  });
  if (libraries.length > 0) {
    params.set('libraries', libraries.join(','));
  }
  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
};

const captureMapsConsoleErrors = (onMapsError: (message: string) => void) => {
  if (process.env.NODE_ENV === 'production') {
    return () => {};
  }
  const original = console.error;
  console.error = (...args: any[]) => {
    const message = args
      .map((arg) => (typeof arg === 'string' ? arg : String(arg)))
      .join(' ');
    if (message.includes('Google Maps JavaScript API error')) {
      onMapsError(message);
    }
    original.apply(console, args);
  };
  return () => {
    console.error = original;
  };
};

export const loadGoogleMaps = (apiKey: string, libraries: string[] = []) => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in the browser.'));
  }

  const existing = (window as any).google?.maps?.Map;
  if (existing) {
    return Promise.resolve((window as any).google);
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      let lastMapsError: string | null = null;
      let settled = false;
      let timeoutId: number | undefined;

      const restoreConsole = captureMapsConsoleErrors((message) => {
        lastMapsError = message;
      });

      const previousAuthFailure = (window as any).gm_authFailure;
      const authFailureHandler = () => {
        lastMapsError = lastMapsError || 'Google Maps authentication failed (gm_authFailure).';
        if (typeof previousAuthFailure === 'function') {
          previousAuthFailure();
        }
      };
      (window as any).gm_authFailure = authFailureHandler;

      const finish = (error?: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        restoreConsole();
        if ((window as any)[MAPS_CALLBACK_NAME]) {
          delete (window as any)[MAPS_CALLBACK_NAME];
        }
        if ((window as any).gm_authFailure === authFailureHandler) {
          if (previousAuthFailure) {
            (window as any).gm_authFailure = previousAuthFailure;
          } else {
            delete (window as any).gm_authFailure;
          }
        }
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
        if (error) {
          googleMapsPromise = null;
          reject(error);
          return;
        }
        resolve((window as any).google);
      };

      const withDiagnostics = (message: string) => {
        if (lastMapsError) {
          return new Error(`${message} ${lastMapsError}`);
        }
        return new Error(message);
      };

      (window as any)[MAPS_CALLBACK_NAME] = () => {
        const google = (window as any).google;
        if (!google?.maps?.Map) {
          finish(withDiagnostics('Google Maps loaded but Map constructor is unavailable.'));
          return;
        }
        finish();
      };

      const script = document.createElement('script');
      script.src = buildGoogleMapsUrl(apiKey, libraries);
      script.async = true;
      script.defer = true;
      script.onerror = () => finish(withDiagnostics('Failed to load Google Maps script.'));
      document.head.appendChild(script);

      timeoutId = window.setTimeout(() => {
        finish(withDiagnostics('Timed out loading Google Maps.'));
      }, 10000);
    });
  }

  return googleMapsPromise;
};
