import { Suspense } from 'react';

import App from '@/App';
import ConsultationRoom from '@/components/ConsultationRoom';
import { LoadingSpinner } from '@/components/ui';
import { useConsultation } from '@/hooks/useConsultations';
import telehealthTranslations from '@/locales/telehealth.json';
import { extensionManager } from '@/utils/extension';

const ns = extensionManager.getNsForTranslation('telehealth');
extensionManager.registerTranslation(ns, telehealthTranslations);

interface ConsultationRoomInnerProps {
  consultationId: string;
  onEnded?: () => void;
}

const ConsultationRoomInner: React.FC<ConsultationRoomInnerProps> = ({
  consultationId,
  onEnded
}) => {
  const { data: consultation, isLoading } = useConsultation(consultationId);

  if (isLoading) return <LoadingSpinner fullHeight label="Loading consultation..." />;
  if (!consultation) return null;

  return (
    <ConsultationRoom ns={ns} consultation={consultation} onEnded={onEnded ?? (() => undefined)} />
  );
};

interface ConsultationRoomContainerProps {
  consultationId: string;
  onEnded?: () => void;
}

const ConsultationRoomContainer: React.FC<ConsultationRoomContainerProps> = ({
  consultationId,
  onEnded
}) => (
  <App>
    <Suspense fallback={<LoadingSpinner fullHeight label="Loading..." />}>
      <ConsultationRoomInner consultationId={consultationId} onEnded={onEnded} />
    </Suspense>
  </App>
);

export default ConsultationRoomContainer;
