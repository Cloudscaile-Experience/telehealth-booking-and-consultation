import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCancelBooking, useConfirmBooking } from '@/hooks/useBookings';
import { useProvider } from '@/hooks/useProviders';
import type { BookingDetail, BookingStatus } from '@/types/telehealth';
import { getAvatarColor, getInitials } from '@/utils/helpers';

dayjs.extend(utc);

const STATUS_COLOR: Record<BookingStatus, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'error',
  completed: 'default',
  no_show: 'error'
};

interface BookingDetailViewProps {
  ns: string;
  booking: BookingDetail;
  onJoinSession?: (bookingId: string) => void;
}

const BookingDetailView: React.FC<BookingDetailViewProps> = ({ ns, booking, onJoinSession }) => {
  const { t } = useTranslation(ns);
  const { data: provider } = useProvider(booking.providerId);

  const [confirmDialog, setConfirmDialog] = useState<'confirm' | 'cancel' | null>(null);

  const confirmBooking = useConfirmBooking();
  const cancelBooking = useCancelBooking();

  const slotStart = dayjs.utc(booking.slot.startTime).local();
  const slotEnd = dayjs.utc(booking.slot.endTime).local();

  const canConfirm = booking.status === 'pending';
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const canJoin = booking.status === 'confirmed' && Boolean(onJoinSession);

  const handleConfirm = async () => {
    await confirmBooking.mutateAsync(booking.id);
    setConfirmDialog(null);
  };

  const handleCancel = async () => {
    await cancelBooking.mutateAsync(booking.id);
    setConfirmDialog(null);
  };

  const displayName = provider?.name ?? `Provider …${booking.providerId.slice(-6)}`;

  return (
    <>
      <Stack spacing={3}>
        {/* Status banner */}
        {booking.status === 'confirmed' && (
          <Alert severity="success" icon={<CheckCircleOutlineIcon fontSize="small" />}>
            This appointment is confirmed.
          </Alert>
        )}
        {booking.status === 'cancelled' && (
          <Alert severity="error">This appointment has been cancelled.</Alert>
        )}

        {/* Provider card */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Avatar
            src={provider?.avatarUrl ?? undefined}
            sx={{
              width: 56,
              height: 56,
              bgcolor: getAvatarColor(displayName),
              fontSize: 18,
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            {getInitials(displayName)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {displayName}
            </Typography>
            {provider?.specialty && (
              <Chip
                label={t(`specialty.${provider.specialty}`)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mt: 0.5, fontSize: 11, height: 20 }}
              />
            )}
          </Box>
          <Chip
            label={t(`bookingStatus.${booking.status}`)}
            color={STATUS_COLOR[booking.status]}
            variant="outlined"
            sx={{ fontWeight: 600, flexShrink: 0 }}
          />
        </Paper>

        {/* Appointment time */}
        <Stack spacing={0.75}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            {t('bookingDetail.appointmentTime')}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <EventIcon color="action" />
            <Box>
              <Typography variant="body1" fontWeight={600}>
                {slotStart.format('dddd, MMMM D, YYYY')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {slotStart.format('h:mm A')} – {slotEnd.format('h:mm A')}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Divider />

        {/* Patient info */}
        <Stack spacing={0.75}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            Patient
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <PersonIcon color="action" />
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {booking.patientId}
            </Typography>
          </Stack>
        </Stack>

        {/* Patient notes */}
        {booking.patientNotes && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.default',
              border: 1,
              borderColor: 'divider'
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              {t('bookingDetail.patientNotes')}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {booking.patientNotes}
            </Typography>
          </Box>
        )}

        <Typography variant="caption" color="text.disabled">
          {t('bookingDetail.bookedOn')}{' '}
          {dayjs.utc(booking.createdAt).local().format('MMM D, YYYY [at] h:mm A')}
        </Typography>

        {/* Actions */}
        {(canConfirm || canCancel || canJoin) && (
          <>
            <Divider />
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              {canJoin && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<VideoCallIcon />}
                  onClick={() => onJoinSession!(booking.id)}
                  sx={{ borderRadius: 2 }}
                >
                  {t('bookingDetail.joinSession')}
                </Button>
              )}
              {canConfirm && (
                <Button
                  variant="contained"
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => setConfirmDialog('confirm')}
                  sx={{ borderRadius: 2 }}
                >
                  {t('bookingDetail.confirmAction')}
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelOutlinedIcon />}
                  onClick={() => setConfirmDialog('cancel')}
                  sx={{ borderRadius: 2 }}
                >
                  {t('myBookings.cancelAppointment')}
                </Button>
              )}
            </Stack>
          </>
        )}
      </Stack>

      {/* Confirm dialog */}
      <Dialog
        open={confirmDialog === 'confirm'}
        onClose={() => setConfirmDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight={600}>{t('bookingDetail.confirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('bookingDetail.confirmMessage')}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDialog(null)} color="inherit">
            {t('actions.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={confirmBooking.isPending}
            startIcon={
              confirmBooking.isPending ? <CircularProgress size={16} color="inherit" /> : undefined
            }
            sx={{ borderRadius: 2 }}
          >
            {t('bookingDetail.confirmAction')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog
        open={confirmDialog === 'cancel'}
        onClose={() => setConfirmDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight={600}>{t('bookingDetail.cancelTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('bookingDetail.cancelMessage')}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDialog(null)} color="inherit">
            {t('actions.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={cancelBooking.isPending}
            sx={{ borderRadius: 2 }}
          >
            {t('bookingDetail.cancelAction')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookingDetailView;
