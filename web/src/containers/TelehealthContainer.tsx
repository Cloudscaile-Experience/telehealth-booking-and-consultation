import { Box, Divider, Tab, Tabs } from '@mui/material';
import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

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

const DEFAULT_CONSULTATION_BASE_PATH = '/telehealth/consultation';

interface TelehealthInnerProps {
  consultationBasePath: string;
}

const TelehealthInner: React.FC<TelehealthInnerProps> = ({ consultationBasePath }) => {
  const { t } = useTranslation(ns);
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);

  const handleJoinSession = (consultationId: string) => {
    navigate(`${consultationBasePath}/${consultationId}`);
  };

  const handleBrowseProviders = () => setTab(0);

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

      {tab === 0 && <ProviderDirectory ns={ns} onBook={setBookingProvider} />}
      {tab === 1 && (
        <MyBookings
          ns={ns}
          onBrowseProviders={handleBrowseProviders}
          onJoinSession={handleJoinSession}
        />
      )}

      <BookingFlow ns={ns} provider={bookingProvider} onClose={() => setBookingProvider(null)} />
    </>
  );
};

export interface TelehealthContainerProps {
  consultationBasePath?: string;
}

const TelehealthContainer: React.FC<TelehealthContainerProps> = ({
  consultationBasePath = DEFAULT_CONSULTATION_BASE_PATH
}) => (
  <App>
    <Suspense fallback={<LoadingSpinner fullHeight label="Loading..." />}>
      <TelehealthInner consultationBasePath={consultationBasePath} />
    </Suspense>
  </App>
);

export default TelehealthContainer;
