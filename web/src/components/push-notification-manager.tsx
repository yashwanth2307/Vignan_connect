'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      if (Notification.permission === 'granted') {
        checkSubscription();
      } else if (Notification.permission === 'default') {
        setShowPrompt(true);
      }
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setIsSubscribed(true);
      } else {
        // Auto subscribe if permission is already granted
        subscribeUser();
      }
    } catch (err) {
      console.error('Check subscription error:', err);
    }
  };

  const subscribeUser = async () => {
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setShowPrompt(false);
        return;
      }

      // Fetch VAPID key from backend
      const res = await api.get('/push/vapid-key', { skipAuth: true });
      const vapidPublicKey = res.data?.publicKey || 'BKmTKAFEr-D7jN6TmfcY96-XYla86BARvpO7OL9cASh_cerAPB1s2_Jc-3SUI3bmikCxmSg__TBYyFkpCNGb2pU';

      const reg = await navigator.serviceWorker.ready;
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      const subJson = sub.toJSON();

      await api.post('/push/subscribe', {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      });

      setIsSubscribed(true);
      setShowPrompt(false);
    } catch (err) {
      console.error('Failed to subscribe user to push notifications:', err);
    }
  };

  if (!isSupported || isSubscribed || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 shadow-xl flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
        <Bell className="w-5 h-5 animate-bounce" />
      </div>
      <div className="flex-1 text-xs">
        <p className="font-bold text-gray-900 dark:text-white">Enable Notifications</p>
        <p className="text-gray-500 dark:text-gray-400">Get instant updates on announcements & schedules!</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button size="sm" onClick={subscribeUser} className="h-7 text-xs px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">
          Enable
        </Button>
        <button onClick={() => setShowPrompt(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs px-1">
          ✕
        </button>
      </div>
    </div>
  );
}
