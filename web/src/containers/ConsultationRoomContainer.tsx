import { Suspense } from 'react';
import { useNavigate, useParams } from 'react-router';

import App from '@/App';
import ConsultationRoom from '@/components/ConsultationRoom';
import { LoadingSpinner, PageHeader } from '@/components/ui';
import { useConsultation } from '@/hooks/useConsultations';
import telehealthTranslations from '@/locales/telehealth.json';
import { extensionManager } from '@/utils/extension';

const ns = extensionManager.getNsForTranslation('telehealth');
extensionManager.registerTranslation(ns, telehealthTranslations);

const DEFAULT_BACK_ROUTE = '/telehealth';

interface ConsultationRoomInnerProps {
  consultationId: string;
  backRoute: string;
}

const ConsultationRoomInner: React.FC<ConsultationRoomInnerProps> = ({
  consultationId,
  backRoute
}) => {
  const navigate = useNavigate();
  const { data: consultation, isLoading } = useConsultation(consultationId);

  if (isLoading) {
    return <LoadingSpinner fullHeight label="Loading consultation..." />;
  }

  if (!consultation) {
    return (
      <PageHeader
        title="Consultation not found"
        subtitle="This session does not exist or you do not have access."
      />
    );
  }

  return (
    <ConsultationRoom ns={ns} consultation={consultation} onEnded={() => navigate(backRoute)} />
  );
};

export interface ConsultationRoomContainerProps {
  consultationId?: string;
  backRoute?: string;
}

const ConsultationRoomContainer: React.FC<ConsultationRoomContainerProps> = ({
  consultationId: consultationIdProp,
  backRoute = DEFAULT_BACK_ROUTE
}) => {
  const params = useParams<{ consultationId: string }>();
  const resolvedConsultationId = consultationIdProp ?? params.consultationId ?? '';

  return (
    <App>
      <Suspense fallback={<LoadingSpinner fullHeight label="Loading..." />}>
        <ConsultationRoomInner consultationId={resolvedConsultationId} backRoute={backRoute} />
      </Suspense>
    </App>
  );
};

export default ConsultationRoomContainer;
