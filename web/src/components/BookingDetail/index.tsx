import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NotesIcon from '@mui/icons-material/Notes';
import VideocamIcon from '@mui/icons-material/Videocam';
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

const STATUS_CHIP_COLOR: Record<
  BookingStatus,
  'warning' | 'success' | 'error' | 'default' | 'info'
> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'error',
  completed: 'default',
  no_show: 'error'
};

interface BookingDetailViewProps {
  ns: string;
  booking: BookingDetail;
  onJoinSession?: (consultationId: string) => void;
  onBack?: () => void;
}

const BookingDetailView: React.FC<BookingDetailViewProps> = ({
  ns,
  booking,
  onJoinSession,
  onBack
}) => {
  const { t } = useTranslation(ns);
  const { data: provider } = useProvider(booking.providerId);

  const [confirmDialog, setConfirmDialog] = useState<'confirm' | 'cancel' | null>(null);
  const confirmBooking = useConfirmBooking();
  const cancelBooking = useCancelBooking();

  const slotStart = dayjs.utc(booking.slot.startTime).local();
  const slotEnd = dayjs.utc(booking.slot.endTime).local();

  const canConfirm = booking.status === 'pending';
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const canJoin =
    booking.status === 'confirmed' && Boolean(onJoinSession) && Boolean(booking.consultationId);

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
      <Stack spacing={3} sx={{ maxWidth: 640, mx: 'auto', px: 3, py: 2 }}>
        {/* Back */}
        {onBack && (
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={onBack}
              color="inherit"
              size="small"
              sx={{ ml: -0.5, fontWeight: 500 }}
            >
              {t('tabs.myAppointments')}
            </Button>
          </Box>
        )}

        {/* Status alert */}
        {booking.status === 'pending' && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Awaiting confirmation from the provider.
          </Alert>
        )}
        {booking.status === 'confirmed' && (
          <Alert
            severity="success"
            icon={<CheckCircleOutlineIcon fontSize="small" />}
            sx={{ borderRadius: 2 }}
          >
            This appointment is confirmed.
          </Alert>
        )}
        {booking.status === 'cancelled' && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            This appointment has been cancelled.
          </Alert>
        )}

        {/* Provider hero */}
        <Paper
          variant="outlined"
          sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2.5 }}
        >
          <Avatar
            src={provider?.avatarUrl ?? undefined}
            sx={{
              width: 64,
              height: 64,
              bgcolor: getAvatarColor(displayName),
              fontSize: 20,
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            {getInitials(displayName)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} noWrap>
              {displayName}
            </Typography>
            {provider?.specialty && (
              <Chip
                label={t(`specialty.${provider.specialty}`)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mt: 0.5, fontSize: 11, height: 22 }}
              />
            )}
          </Box>

          <Chip
            label={t(`bookingStatus.${booking.status}`)}
            color={STATUS_CHIP_COLOR[booking.status]}
            variant="filled"
            sx={{ fontWeight: 600, flexShrink: 0 }}
          />
        </Paper>

        {/* Appointment time block */}
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            borderLeft: '4px solid',
            borderLeftColor: 'primary.main'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 2.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <CalendarMonthIcon sx={{ color: 'primary.contrastText', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ lineHeight: 1.2, display: 'block' }}
              >
                {t('bookingDetail.appointmentTime')}
              </Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {slotStart.format('dddd, MMMM D, YYYY')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {slotStart.format('h:mm A')} – {slotEnd.format('h:mm A')}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Reason for visit */}
        {booking.patientNotes && (
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <NotesIcon fontSize="small" color="action" />
              <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                {t('bookingDetail.patientNotes')}
              </Typography>
            </Stack>
            <Typography variant="body2">{booking.patientNotes}</Typography>
          </Paper>
        )}

        {/* Booked on */}
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
          {t('bookingDetail.bookedOn')}{' '}
          {dayjs.utc(booking.createdAt).local().format('MMM D, YYYY [at] h:mm A')}
        </Typography>

        {/* Actions */}
        {(canJoin || canConfirm || canCancel) && (
          <>
            <Divider />
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              {canJoin && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<VideocamIcon />}
                  onClick={() => booking.consultationId && onJoinSession?.(booking.consultationId)}
                  sx={{ flexGrow: 1 }}
                >
                  {t('bookingDetail.joinSession')}
                </Button>
              )}
              {canConfirm && (
                <Button
                  variant="contained"
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => setConfirmDialog('confirm')}
                  sx={{ flexGrow: 1 }}
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
                  sx={{ flexGrow: 1 }}
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
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700} sx={{ pb: 1 }}>
          {t('bookingDetail.confirmTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t('bookingDetail.confirmMessage')}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setConfirmDialog(null)} color="inherit" sx={{ flex: 1 }}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={confirmBooking.isPending}
            startIcon={
              confirmBooking.isPending ? <CircularProgress size={16} color="inherit" /> : undefined
            }
            sx={{ flex: 1 }}
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
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700} sx={{ pb: 1 }}>
          {t('bookingDetail.cancelTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t('bookingDetail.cancelMessage')}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setConfirmDialog(null)} color="inherit" sx={{ flex: 1 }}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={cancelBooking.isPending}
            sx={{ flex: 1 }}
          >
            {t('bookingDetail.cancelAction')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookingDetailView;
