import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, useState } from 'react';

import BookingFlow from '@/components/BookingFlow';
import ProviderDirectory from '@/components/ProviderDirectory';
import { ErrorBoundary, LoadingSpinner, PageHeader } from '@/components/ui';
import telehealthTranslations from '@/locales/telehealth.json';
import type { Provider } from '@/types/telehealth';
import { extensionManager } from '@/utils/extension';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 2 } }
});

const ns = extensionManager.getNsForTranslation('telehealth');
extensionManager.registerTranslation(ns, telehealthTranslations);

const TelehealthInner: React.FC = () => {
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);

  return (
    <>
      <PageHeader title={telehealthTranslations.title} subtitle={telehealthTranslations.subtitle} />
      <ProviderDirectory ns={ns} onBook={setBookingProvider} />
      <BookingFlow ns={ns} provider={bookingProvider} onClose={() => setBookingProvider(null)} />
    </>
  );
};

const TelehealthContainer: React.FC = () => (
  <ThemeProvider theme={extensionManager.getTheme()}>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner fullHeight label="Loading..." />}>
          <TelehealthInner />
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  </ThemeProvider>
);

export default TelehealthContainer;
