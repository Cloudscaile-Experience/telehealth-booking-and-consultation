import { Suspense } from 'react';
import { useNavigate, useParams } from 'react-router';

import App from '@/App';
import BookingDetailView from '@/components/BookingDetail';
import { LoadingSpinner, PageHeader } from '@/components/ui';
import { useBooking } from '@/hooks/useBookings';
import telehealthTranslations from '@/locales/telehealth.json';
import type { BookingDetail } from '@/types/telehealth';
import { extensionManager } from '@/utils/extension';

const ns = extensionManager.getNsForTranslation('telehealth');
extensionManager.registerTranslation(ns, telehealthTranslations);

const DEFAULT_CONSULTATION_BASE_PATH = '/telehealth/consultation';
const DEFAULT_BACK_ROUTE = '/telehealth';

interface BookingDetailInnerProps {
  bookingId: string;
  consultationBasePath: string;
  backRoute: string;
}

const BookingDetailInner: React.FC<BookingDetailInnerProps> = ({
  bookingId,
  consultationBasePath,
  backRoute
}) => {
  const navigate = useNavigate();
  const { data: booking, isLoading } = useBooking(bookingId);

  if (isLoading) {
    return <LoadingSpinner fullHeight label="Loading appointment..." />;
  }

  if (!booking) {
    return (
      <PageHeader
        title="Appointment not found"
        subtitle="This appointment does not exist or you do not have access."
      />
    );
  }

  return (
    <BookingDetailView
      ns={ns}
      booking={booking as BookingDetail}
      onJoinSession={(id) => navigate(`${consultationBasePath}/${id}`)}
      onBack={() => navigate(backRoute)}
    />
  );
};

export interface BookingDetailContainerProps {
  bookingId?: string;
  consultationBasePath?: string;
  backRoute?: string;
}

const BookingDetailContainer: React.FC<BookingDetailContainerProps> = ({
  bookingId: bookingIdProp,
  consultationBasePath = DEFAULT_CONSULTATION_BASE_PATH,
  backRoute = DEFAULT_BACK_ROUTE
}) => {
  const params = useParams<{ bookingId: string }>();
  const resolvedBookingId = bookingIdProp ?? params.bookingId ?? '';

  return (
    <App>
      <Suspense fallback={<LoadingSpinner fullHeight label="Loading..." />}>
        <BookingDetailInner
          bookingId={resolvedBookingId}
          consultationBasePath={consultationBasePath}
          backRoute={backRoute}
        />
      </Suspense>
    </App>
  );
};

export default BookingDetailContainer;
