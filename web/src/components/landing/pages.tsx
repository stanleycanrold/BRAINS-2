'use client';

import React from 'react';
import { useStudioEntry } from './MarketingShell';
import { WebPricingSection } from './components/web/WebPricingSection';
import { WebRunwayCalculator } from './components/web/WebRunwayCalculator';

/**
 * The /pricing body, composed from the empirical pricing sections. The
 * published rates and track details that back it live in PricingDetails,
 * mounted by the route beneath this.
 */
export function PricingPage() {
  const { openContact } = useStudioEntry();
  return (
    <>
      <WebPricingSection onOpenContact={openContact} />
      <WebRunwayCalculator onOpenContact={openContact} />
    </>
  );
}
