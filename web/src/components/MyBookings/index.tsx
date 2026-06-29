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
  Stack
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState, LoadingSpinner } from '@/components/ui';
import { useBooking, useBookings, useCancelBooking, useConfirmBooking } from '@/hooks/useBookings';
import { useProvider } from '@/hooks/useProviders';
import type { BookingDetail, Provider } from '@/types/telehealth';

import BookingCard from './BookingCard';

const PAGE_SIZE = 10;

interface BookingDetailLoaderProps {
  bookingId: string;
  providerId: string;
  ns: string;
  onCancel: (id: string) => void;
  onConfirm: (id: string) => void;
  onJoin?: (id: string) => void;
}

const BookingDetailLoader: React.FC<BookingDetailLoaderProps> = ({
  bookingId,
  providerId,
  ns,
  onCancel,
  onConfirm,
  onJoin
}) => {
  const { data: booking } = useBooking(bookingId);
  const { data: provider } = useProvider(providerId);

  if (!booking) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Skeleton variant="circular" width={44} height={44} />
              <Stack sx={{ flex: 1 }}>
                <Skeleton variant="text" width={200} />
                <Skeleton variant="text" width={130} />
              </Stack>
              <Skeleton variant="rounded" width={80} height={22} sx={{ borderRadius: 10 }} />
            </Stack>
            <Skeleton variant="text" width="60%" />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <BookingCard
      ns={ns}
      booking={booking as BookingDetail}
      provider={provider as Provider | undefined}
      onCancel={onCancel}
      onConfirm={onConfirm}
      onJoin={onJoin}
    />
  );
};

interface MyBookingsProps {
  ns: string;
  onBrowseProviders: () => void;
  onJoinSession?: (bookingId: string) => void;
}

const MyBookings: React.FC<MyBookingsProps> = ({ ns, onBrowseProviders, onJoinSession }) => {
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
      <Stack spacing={2.5} sx={{ p: 3 }}>
        {data.data.map((booking) => (
          <BookingDetailLoader
            key={booking.id}
            bookingId={booking.id}
            providerId={booking.providerId}
            ns={ns}
            onCancel={setCancelTargetId}
            onConfirm={(id) => confirmBooking.mutate(id)}
            onJoin={onJoinSession}
          />
        ))}

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

      {/* Cancel confirmation dialog */}
      <Dialog
        open={Boolean(cancelTargetId)}
        onClose={() => setCancelTargetId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight={600}>{t('myBookings.cancelDialogTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('myBookings.cancelDialogMessage')}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelTargetId(null)} color="inherit">
            {t('actions.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelConfirm}
            disabled={cancelBooking.isPending}
            sx={{ borderRadius: 2 }}
          >
            {t('myBookings.cancelDialogConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MyBookings;
