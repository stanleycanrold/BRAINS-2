'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { IdeaComposerModal } from './components/IdeaComposerModal';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { ContactModal } from '@/components/ContactModal';
import { dashboardUrl } from '@/lib/urls';

type AddToast = (
  title: string,
  description?: string,
  type?: 'success' | 'error' | 'info',
) => void;

const StudioEntryContext = createContext<{
  openComposer: () => void;
  openStudio: () => void;
  openContact: () => void;
  addToast: AddToast;
}>({ openComposer: () => {}, openStudio: () => {}, openContact: () => {}, addToast: () => {} });

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
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast: AddToast = useCallback((title, description, type = 'success') => {
    const id = `toast-${crypto.randomUUID()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openComposer = useCallback(() => setIsComposerOpen(true), []);
  const openContact = useCallback(() => setIsContactOpen(true), []);

  // Cross-origin: the studio lives at app.brains.im.
  const openStudio = useCallback(() => {
    window.location.href = dashboardUrl;
  }, []);

  return (
    <StudioEntryContext.Provider value={{ openComposer, openStudio, openContact, addToast }}>
      <div className="min-h-screen bg-page text-primary flex flex-col">
        <Nav onContact={openContact} />

        <main className="flex-1">{children}</main>

        <Footer onContact={openContact} />
      </div>

      <IdeaComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onShowToast={addToast}
      />

      <ContactModal open={isContactOpen} onClose={() => setIsContactOpen(false)} />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </StudioEntryContext.Provider>
  );
}
