'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { ContactModal } from '@/components/ContactModal';

type AddToast = (
  title: string,
  description?: string,
  type?: 'success' | 'error' | 'info',
) => void;

const StudioEntryContext = createContext<{
  openContact: () => void;
  addToast: AddToast;
  // legacy no-ops for any remaining callers during transition
  openComposer: () => void;
  openStudio: () => void;
}>({ openContact: () => {}, addToast: () => {}, openComposer: () => {}, openStudio: () => {} });

export function useStudioEntry() {
  return useContext(StudioEntryContext);
}

/**
 * Client shell for every public page on brains.im: the site's own nav and
 * footer (three links, one sign-up action - the marketing format this site
 * has always had) plus the idea composer mounted once at this level so any
 * CTA on any page can open it. The composer hands the composed brief to
 * app.brains.im sign-up as a draft; "Open Studio" navigates cross-origin to
 * the app. The marketing site has no backend and fabricates nothing.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast: AddToast = useCallback((title, description, type = 'success') => {
    const id = `toast-${crypto.randomUUID()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openContact = useCallback(() => setIsContactOpen(true), []);
  // legacy shims
  const openComposer = openContact;
  const openStudio = openContact;

  return (
    <StudioEntryContext.Provider value={{ openComposer, openStudio, openContact, addToast }}>
      <div className="min-h-screen bg-page text-primary flex flex-col">
        <Nav onContact={openContact} />

        <main className="flex-1">{children}</main>

        <Footer onContact={openContact} />
      </div>

      <ContactModal open={isContactOpen} onClose={() => setIsContactOpen(false)} />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </StudioEntryContext.Provider>
  );
}
