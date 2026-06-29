import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import App from '@/App';
import BookingFlow from '@/components/BookingFlow';
import ProviderDirectory from '@/components/ProviderDirectory';
import { LoadingSpinner, PageHeader } from '@/components/ui';
import telehealthTranslations from '@/locales/telehealth.json';
import type { Provider } from '@/types/telehealth';
import { extensionManager } from '@/utils/extension';

const ns = extensionManager.getNsForTranslation('telehealth');
extensionManager.registerTranslation(ns, telehealthTranslations);

const TelehealthInner: React.FC = () => {
  const { t } = useTranslation(ns);
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <ProviderDirectory ns={ns} onBook={setBookingProvider} />
      <BookingFlow ns={ns} provider={bookingProvider} onClose={() => setBookingProvider(null)} />
    </>
  );
};

const TelehealthContainer: React.FC = () => (
  <App>
    <Suspense fallback={<LoadingSpinner fullHeight label="Loading..." />}>
      <TelehealthInner />
    </Suspense>
  </App>
);

export default TelehealthContainer;
