"use client";
import React from "react";

const CONTACT_EMAIL = "stanley@nexabrains.io";
export const BOOKING_URL = "https://calendar.app.google/PmNmyQbGWNgM5cfz7";

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close contact dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-raised border border-line shadow-xl p-6 space-y-5">
        <h2 className="text-lg font-bold text-primary">Contact us</h2>
        <p className="text-sm text-secondary leading-relaxed">
          We run validations manually first — talk to us directly and we'll scope your research in minutes.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-accent text-sm font-bold transition-colors shadow-sm"
          >
            Book a meeting
            <span aria-hidden>→</span>
          </a>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-tertiary">or email</span>
            <div className="h-px flex-1 bg-line" />
          </div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-page hover:bg-sunken text-primary text-sm font-bold transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
        <p className="text-xs text-tertiary text-center">We typically reply within a few hours.</p>
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
