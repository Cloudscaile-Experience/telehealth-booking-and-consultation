import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Pagination,
  Skeleton,
  Stack,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState, LoadingSpinner } from '@/components/ui';
import { useBooking, useBookings, useCancelBooking, useConfirmBooking } from '@/hooks/useBookings';
import { useProvider } from '@/hooks/useProviders';
import type { BookingDetail, Provider } from '@/types/telehealth';

import BookingCard from './BookingCard';

const PAGE_SIZE = 10;

const BookingCardSkeleton: React.FC = () => (
  <Card
    variant="outlined"
    sx={{ borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: 'divider' }}
  >
    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
      <Stack direction="row" spacing={2} sx={{ p: 2.5 }}>
        <Skeleton variant="circular" width={52} height={52} sx={{ flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Skeleton variant="text" width={180} height={22} />
              <Skeleton variant="text" width={110} height={16} sx={{ mt: 0.25 }} />
            </Box>
            <Skeleton variant="rounded" width={76} height={22} sx={{ borderRadius: 10 }} />
          </Stack>
          <Skeleton variant="rounded" width={220} height={26} sx={{ mt: 1.5, borderRadius: 10 }} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

interface BookingDetailLoaderProps {
  bookingId: string;
  providerId: string;
  ns: string;
  onCancel: (id: string) => void;
  onConfirm: (id: string) => void;
  onJoin?: (id: string) => void;
  onViewDetail?: (id: string) => void;
}

const BookingDetailLoader: React.FC<BookingDetailLoaderProps> = ({
  bookingId,
  providerId,
  ns,
  onCancel,
  onConfirm,
  onJoin,
  onViewDetail
}) => {
  const { data: booking } = useBooking(bookingId);
  const { data: provider } = useProvider(providerId);

  if (!booking) return <BookingCardSkeleton />;

  return (
    <BookingCard
      ns={ns}
      booking={booking as BookingDetail}
      provider={provider as Provider | undefined}
      onCancel={onCancel}
      onConfirm={onConfirm}
      onJoin={onJoin}
      onViewDetail={onViewDetail}
    />
  );
};

interface MyBookingsProps {
  ns: string;
  onBrowseProviders: () => void;
  onJoinSession?: (bookingId: string) => void;
  onViewDetail?: (bookingId: string) => void;
}

const MyBookings: React.FC<MyBookingsProps> = ({
  ns,
  onBrowseProviders,
  onJoinSession,
  onViewDetail
}) => {
  const { t } = useTranslation(ns);
  const [page, setPage] = useState(1);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const { data, isLoading } = useBookings({ page, pageSize: PAGE_SIZE });
  const cancelBooking = useCancelBooking();
  const confirmBooking = useConfirmBooking();

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleCancelConfirm = async () => {
    if (!cancelTargetId) return;
    await cancelBooking.mutateAsync(cancelTargetId);
    setCancelTargetId(null);
  };

  if (isLoading) {
    return <LoadingSpinner fullHeight label={t('myBookings.loading')} />;
  }

  if (!data?.data.length) {
    return (
      <EmptyState
        title={t('myBookings.emptyTitle')}
        description={t('myBookings.emptyDescription')}
        icon={CalendarMonthIcon}
        actionLabel={t('myBookings.browseProviders')}
        onAction={onBrowseProviders}
      />
    );
  }

  return (
    <>
      <Stack spacing={2} sx={{ p: 3 }}>
        {/* Count header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {data.total} {data.total === 1 ? 'appointment' : 'appointments'}
          </Typography>
        </Stack>

        {/* Booking cards */}
        <Stack spacing={2}>
          {data.data.map((booking) => (
            <BookingDetailLoader
              key={booking.id}
              bookingId={booking.id}
              providerId={booking.providerId}
              ns={ns}
              onCancel={setCancelTargetId}
              onConfirm={(id) => confirmBooking.mutate(id)}
              onJoin={onJoinSession}
              onViewDetail={onViewDetail}
            />
          ))}
        </Stack>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
              shape="rounded"
            />
          </Box>
        )}
      </Stack>

      <Dialog
        open={Boolean(cancelTargetId)}
        onClose={() => setCancelTargetId(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700} sx={{ pb: 1 }}>
          {t('myBookings.cancelDialogTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t('myBookings.cancelDialogMessage')}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setCancelTargetId(null)} color="inherit" sx={{ flex: 1 }}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelConfirm}
            disabled={cancelBooking.isPending}
            sx={{ flex: 1 }}
          >
            {t('myBookings.cancelDialogConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MyBookings;
