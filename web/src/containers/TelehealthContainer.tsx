import { Box, Divider, Tab, Tabs } from '@mui/material';
import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import App from '@/App';
import BookingFlow from '@/components/BookingFlow';
import MyBookings from '@/components/MyBookings';
import ProviderDirectory from '@/components/ProviderDirectory';
import { LoadingSpinner, PageHeader } from '@/components/ui';
import telehealthTranslations from '@/locales/telehealth.json';
import type { Provider } from '@/types/telehealth';
import { extensionManager } from '@/utils/extension';

const ns = extensionManager.getNsForTranslation('telehealth');
extensionManager.registerTranslation(ns, telehealthTranslations);

interface TelehealthInnerProps {
  onJoinSession?: (bookingId: string) => void;
}

const TelehealthInner: React.FC<TelehealthInnerProps> = ({ onJoinSession }) => {
  const { t } = useTranslation(ns);
  const [tab, setTab] = useState(0);
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);

  const handleBook = (provider: Provider) => {
    setBookingProvider(provider);
  };

  const handleBrowseProviders = () => {
    setTab(0);
  };

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ px: 3 }}>
          <Tab label={t('tabs.directory')} />
          <Tab label={t('tabs.myAppointments')} />
        </Tabs>
      </Box>

      <Divider />

      {tab === 0 && <ProviderDirectory ns={ns} onBook={handleBook} />}
      {tab === 1 && (
        <MyBookings
          ns={ns}
          onBrowseProviders={handleBrowseProviders}
          onJoinSession={onJoinSession}
        />
      )}

      <BookingFlow ns={ns} provider={bookingProvider} onClose={() => setBookingProvider(null)} />
    </>
  );
};

interface TelehealthContainerProps {
  onJoinSession?: (bookingId: string) => void;
}

const TelehealthContainer: React.FC<TelehealthContainerProps> = ({ onJoinSession }) => (
  <App>
    <Suspense fallback={<LoadingSpinner fullHeight label="Loading..." />}>
      <TelehealthInner onJoinSession={onJoinSession} />
    </Suspense>
  </App>
);

export default TelehealthContainer;
