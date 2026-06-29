import { Suspense } from 'react';

import App from '@/App';
import ProviderManagement from '@/components/ProviderManagement';
import { LoadingSpinner } from '@/components/ui';
import telehealthTranslations from '@/locales/telehealth.json';
import { extensionManager } from '@/utils/extension';

const ns = extensionManager.getNsForTranslation('telehealth');
extensionManager.registerTranslation(ns, telehealthTranslations);

const ProviderManagementContainer: React.FC = () => (
  <App>
    <Suspense fallback={<LoadingSpinner fullHeight label="Loading..." />}>
      <ProviderManagement ns={ns} />
    </Suspense>
  </App>
);

export default ProviderManagementContainer;
