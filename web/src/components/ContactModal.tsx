"use client";
import React from "react";

const CONTACT_EMAIL = "stanley@nexabrains.io";

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close contact dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-raised border border-line shadow-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-primary">Contact us</h2>
        <p className="text-sm text-secondary leading-relaxed">
          Write to us directly — no form, no ticketing system.
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-on-accent text-sm font-bold transition-colors"
        >
          {CONTACT_EMAIL}
        </a>
        <p className="text-xs text-tertiary">Clicking opens your email client.</p>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-sunken text-tertiary hover:text-primary transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export { CONTACT_EMAIL };
