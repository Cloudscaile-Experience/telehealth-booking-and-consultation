import { Suspense } from 'react';

import App from '@/App';
import BookingDetailView from '@/components/BookingDetail';
import { LoadingSpinner, PageHeader } from '@/components/ui';
import { useBooking } from '@/hooks/useBookings';
import telehealthTranslations from '@/locales/telehealth.json';
import type { BookingDetail } from '@/types/telehealth';
import { extensionManager } from '@/utils/extension';

const ns = extensionManager.getNsForTranslation('telehealth');
extensionManager.registerTranslation(ns, telehealthTranslations);

interface BookingDetailInnerProps {
  bookingId: string;
  onJoinSession?: (bookingId: string) => void;
}

const BookingDetailInner: React.FC<BookingDetailInnerProps> = ({ bookingId, onJoinSession }) => {
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
    <BookingDetailView ns={ns} booking={booking as BookingDetail} onJoinSession={onJoinSession} />
  );
};

interface BookingDetailContainerProps {
  bookingId: string;
  onJoinSession?: (bookingId: string) => void;
}

const BookingDetailContainer: React.FC<BookingDetailContainerProps> = ({
  bookingId,
  onJoinSession
}) => (
  <App>
    <Suspense fallback={<LoadingSpinner fullHeight label="Loading..." />}>
      <BookingDetailInner bookingId={bookingId} onJoinSession={onJoinSession} />
    </Suspense>
  </App>
);

export default BookingDetailContainer;
