'use client';

/**
 * The brains.im front door: the empirical landing sections wrapped in the
 * site's own nav and footer - three links and one sign-up action, the
 * marketing format this site has always had. The product lives cross-origin
 * at app.brains.im, so every studio action navigates there, and the idea
 * composer hands the composed brief over as a sign-up draft instead of
 * running any validation here - the marketing site has no backend and
 * fabricates nothing.
 */

import React, { useState } from 'react';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { MobileCta } from '@/components/MobileCta';
import { ToastContainer, ToastMessage } from '@/components/landing/components/Toast';
import { WebPlatform } from '@/components/landing/components/web/WebPlatform';
import { ContactModal } from '@/components/ContactModal';

export default function HomePage() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    title: string,
    description?: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    const id = `toast-${crypto.randomUUID()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      <MobileCta onContact={() => setIsContactOpen(true)} />
      <Nav onContact={() => setIsContactOpen(true)} />

      <WebPlatform onOpenContact={() => setIsContactOpen(true)} />

      <Footer onContact={() => setIsContactOpen(true)} />

      <ContactModal open={isContactOpen} onClose={() => setIsContactOpen(false)} />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </>
  );
}
