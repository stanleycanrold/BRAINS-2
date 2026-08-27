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
  onOpenStudio: () => void;
  onOpenIdeaComposer: () => void;
  onSelectQuickIdea: (idea: string) => void;
}

/**
 * The landing body only: hero plus the proof sections, in the designed
 * order. The site chrome (nav + footer) is the marketing site's own and is
 * mounted by the page, not here, so every page on brains.im shares one nav.
 */
export const WebPlatform: React.FC<WebPlatformProps> = ({
  onOpenStudio,
  onOpenIdeaComposer,
  onSelectQuickIdea,
}) => {
  return (
    <div className="min-h-screen bg-page text-primary flex flex-col font-sans selection:bg-brand selection:text-on-accent">
      <main className="flex-1">
        {/* 1. Clear, Spacious Hero */}
        <WebHero
          onOpenStudio={onOpenStudio}
          onOpenIdeaComposer={onOpenIdeaComposer}
          onTrySandbox={(idea) => {
            onSelectQuickIdea(idea);
            onOpenIdeaComposer();
          }}
        />

        {/* 2. Empathetic Real-Human Discovery */}
        <WebEmpatheticDiscovery
          onOpenStudio={onOpenStudio}
          onOpenIdeaComposer={onOpenIdeaComposer}
        />

        {/* 3. Interactive Studio Artifacts & Snapshots */}
        <WebDashboardSnapshots
          onOpenStudio={onOpenStudio}
          onOpenIdeaComposer={onOpenIdeaComposer}
        />

        {/* 4. The 48-Hour Empirical Process */}
        <WebValidationEngine
          onOpenStudio={onOpenStudio}
          onOpenIdeaComposer={onOpenIdeaComposer}
        />

        {/* 5. 3 Real Failure Modes */}
        <WebProblemMatrix />

        {/* 6. Concrete Founder Outcomes */}
        <WebCaseStudies onOpenStudio={onOpenStudio} />

        {/* 7. Frequently Asked Questions */}
        <WebFaq onOpenIdeaComposer={onOpenIdeaComposer} />
      </main>
    </div>
  );
};
