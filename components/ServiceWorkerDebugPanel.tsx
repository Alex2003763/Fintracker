import React, { useState, useEffect } from 'react';

interface CacheInfo {
  name: string;
  size: number;
  entryCount: number;
}

interface ServiceWorkerInfo {
  isSupported: boolean;
  isRegistered: boolean;
  registration?: ServiceWorkerRegistration;
  version?: string;
  caches: CacheInfo[];
  totalCacheSize: number;
}

const ServiceWorkerDebugPanel: React.FC = () => {
  const [swInfo, setSwInfo] = useState<ServiceWorkerInfo>({
    isSupported: false,
    isRegistered: false,
    caches: [],
    totalCacheSize: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    checkServiceWorkerStatus();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkServiceWorkerStatus = async () => {
    setIsLoading(true);

    try {
      // Check if service workers are supported
      const isSupported = 'serviceWorker' in navigator;

      if (!isSupported) {
        setSwInfo(prev => ({ ...prev, isSupported: false, isRegistered: false }));
        setIsLoading(false);
        return;
      }

      // Check registration status
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration) {
        // Get cache information
        const cacheNames = await caches.keys();
        const cacheInfos: CacheInfo[] = [];
        let totalSize = 0;

        for (const cacheName of cacheNames) {
          try {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            const entryCount = keys.length;

            // Estimate cache size (this is approximate)
            let size = 0;
            for (const request of keys.slice(0, 10)) { // Sample first 10 entries
              const response = await cache.match(request);
              if (response) {
                const blob = await response.blob();
                size += blob.size;
              }
            }

            cacheInfos.push({ name: cacheName, size, entryCount });
            totalSize += size;
          } catch (error) {
            console.error(`Error checking cache ${cacheName}:`, error);
          }
        }

        setSwInfo({
          isSupported: true,
          isRegistered: true,
          registration,
          version: registration.scope || 'Unknown',
          caches: cacheInfos,
          totalCacheSize: totalSize
        });
      } else {
        setSwInfo(prev => ({
          ...prev,
          isSupported: true,
          isRegistered: false
        }));
      }
    } catch (error) {
      console.error('Error checking service worker status:', error);
      setSwInfo(prev => ({
        ...prev,
        isSupported: 'serviceWorker' in navigator,
        isRegistered: false
      }));
    }

    setIsLoading(false);
  };

  const clearAllCaches = async () => {
    if (!confirm('Are you sure you want to clear all caches? This may affect offline functionality.')) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      alert('All caches cleared successfully!');
      await checkServiceWorkerStatus();
    } catch (error) {
      console.error('Error clearing caches:', error);
      alert('Error clearing caches. Check console for details.');
    }
  };

  const unregisterServiceWorker = async () => {
    if (!confirm('Are you sure you want to unregister the service worker? The app may not work properly until refreshed.')) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        alert('Service worker unregistered successfully! Please refresh the page.');
        await checkServiceWorkerStatus();
      }
    } catch (error) {
      console.error('Error unregistering service worker:', error);
      alert('Error unregistering service worker. Check console for details.');
    }
  };

  const refreshServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        alert('Service worker update check completed!');
        await checkServiceWorkerStatus();
      }
    } catch (error) {
      console.error('Error refreshing service worker:', error);
      alert('Error refreshing service worker. Check console for details.');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="bg-[rgb(var(--color-card-rgb))] rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-[rgb(var(--color-text-rgb))]">
          Service Worker Debug Panel
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary-rgb))]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[rgb(var(--color-card-rgb))] rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-[rgb(var(--color-text-rgb))]">
        Service Worker Debug Panel
      </h3>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
              Service Worker Support:
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              swInfo.isSupported
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {swInfo.isSupported ? 'Supported' : 'Not Supported'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
              Registration Status:
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              swInfo.isRegistered
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {swInfo.isRegistered ? 'Registered' : 'Not Registered'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
              Network Status:
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              isOnline
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
              Total Cache Size:
            </span>
            <span className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
              {formatBytes(swInfo.totalCacheSize)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
              Cache Count:
            </span>
            <span className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
              {swInfo.caches.length}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
              Version/Scope:
            </span>
            <span className="text-xs text-[rgb(var(--color-text-muted-rgb))] max-w-32 truncate">
              {swInfo.version || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Cache Details */}
      {swInfo.caches.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-3 text-[rgb(var(--color-text-rgb))]">
            Cache Details
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {swInfo.caches.map((cache, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-[rgb(var(--color-card-muted-rgb))] rounded">
                <div>
                  <div className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
                    {cache.name}
                  </div>
                  <div className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
                    {cache.entryCount} entries
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
                    {formatBytes(cache.size)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Controls */}
      <div className="space-y-3">
        <h4 className="text-md font-medium text-[rgb(var(--color-text-rgb))]">
          Debug Controls
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={refreshServiceWorker}
            className="px-3 py-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded text-sm font-medium hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors"
          >
            Refresh SW
          </button>

          <button
            onClick={clearAllCaches}
            className="px-3 py-2 bg-yellow-600 text-white rounded text-sm font-medium hover:bg-yellow-700 transition-colors"
          >
            Clear Caches
          </button>

          <button
            onClick={unregisterServiceWorker}
            className="px-3 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Unregister SW
          </button>

          <button
            onClick={checkServiceWorkerStatus}
            className="px-3 py-2 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>

      {/* Technical Details */}
      <div className="mt-6 pt-4 border-t border-[rgb(var(--color-border-rgb))]">
        <h4 className="text-md font-medium mb-2 text-[rgb(var(--color-text-rgb))]">
          Technical Details
        </h4>
        <div className="text-xs text-[rgb(var(--color-text-muted-rgb))] space-y-1">
          <div>User Agent: {navigator.userAgent}</div>
          <div>Platform: {navigator.platform}</div>
          <div>Cookie Enabled: {navigator.cookieEnabled ? 'Yes' : 'No'}</div>
          <div>Local Storage: {typeof Storage !== 'undefined' ? 'Supported' : 'Not Supported'}</div>
        </div>
      </div>
    </div>
  );
};

export default ServiceWorkerDebugPanel;