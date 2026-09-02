"use client";
import React from 'react';
import { WebHero } from './WebHero';
import { WebDashboardSnapshots } from './WebDashboardSnapshots';
import { WebEmpatheticDiscovery } from './WebEmpatheticDiscovery';
import { WebProblemMatrix } from './WebProblemMatrix';
import { WebValidationEngine } from './WebValidationEngine';
import { WebCaseStudies } from './WebCaseStudies';
import { WebFaq } from './WebFaq';

interface WebPlatformProps {
  onOpenContact: () => void;
  // Legacy props kept for compat but ignored — SaaS flow removed, manual via contact only
  onOpenStudio?: () => void;
  onOpenIdeaComposer?: () => void;
  onSelectQuickIdea?: (idea: string) => void;
}

/**
 * The landing body only: hero plus the proof sections, in the designed
 * order. The site chrome (nav + footer) is the marketing site's own and is
 * mounted by the page, not here, so every page on brains.im shares one nav.
 */
export const WebPlatform: React.FC<WebPlatformProps> = ({
  onOpenContact,
}) => {
  return (
    <div className="min-h-screen bg-page text-primary flex flex-col font-sans selection:bg-brand selection:text-on-accent">
      <main className="flex-1">
        {/* 1. Clear, Spacious Hero */}
        <WebHero onOpenContact={onOpenContact} />

        {/* 2. Empathetic Real-Human Discovery */}
        <WebEmpatheticDiscovery onOpenContact={onOpenContact} />

        {/* 3. Interactive Studio Artifacts & Snapshots */}
        <WebDashboardSnapshots onOpenContact={onOpenContact} />

        {/* 4. The 48-Hour Empirical Process */}
        <WebValidationEngine onOpenContact={onOpenContact} />

        {/* 5. 3 Real Failure Modes */}
        <WebProblemMatrix />

        {/* 6. Concrete Founder Outcomes */}
        <WebCaseStudies onOpenContact={onOpenContact} />

        {/* 7. Frequently Asked Questions */}
        <WebFaq onOpenContact={onOpenContact} />
      </main>
    </div>
  );
};
