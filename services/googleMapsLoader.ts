let googleMapsPromise: Promise<any> | null = null;

const buildGoogleMapsUrl = (apiKey: string, libraries: string[]) => {
  const params = new URLSearchParams({ key: apiKey, v: 'weekly', loading: 'async' });
  if (libraries.length > 0) {
    params.set('libraries', libraries.join(','));
  }
  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
};

export const loadGoogleMaps = (apiKey: string, libraries: string[] = []) => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in the browser.'));
  }

  const existing = (window as any).google?.maps;
  if (existing) {
    return Promise.resolve((window as any).google);
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = buildGoogleMapsUrl(apiKey, libraries);
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const google = (window as any).google;
        if (!google?.maps) {
          reject(new Error('Google Maps failed to initialize.'));
          return;
        }
        resolve(google);
      };
      script.onerror = () => reject(new Error('Failed to load Google Maps.'));
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
};
