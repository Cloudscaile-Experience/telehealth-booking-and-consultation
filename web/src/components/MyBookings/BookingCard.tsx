import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventIcon from '@mui/icons-material/Event';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { Avatar, Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useTranslation } from 'react-i18next';

import type { BookingDetail, BookingStatus, Provider } from '@/types/telehealth';
import { getAvatarColor, getInitials } from '@/utils/helpers';

dayjs.extend(utc);

const STATUS_COLOR: Record<BookingStatus, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'error',
  completed: 'default',
  no_show: 'error'
};

interface BookingCardProps {
  ns: string;
  booking: BookingDetail;
  provider?: Provider;
  onCancel: (id: string) => void;
  onConfirm?: (id: string) => void;
  onJoin?: (id: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  ns,
  booking,
  provider,
  onCancel,
  onConfirm,
  onJoin
}) => {
  const { t } = useTranslation(ns);

  const slotStart = dayjs.utc(booking.slot.startTime).local();
  const slotEnd = dayjs.utc(booking.slot.endTime).local();
  const displayName = provider?.name ?? `Provider …${booking.providerId.slice(-6)}`;

  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const canConfirm = booking.status === 'pending' && Boolean(onConfirm);
  const canJoin = booking.status === 'confirmed' && Boolean(onJoin);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 2 }
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          {/* Header: provider info + status chip */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                src={provider?.avatarUrl ?? undefined}
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: getAvatarColor(displayName),
                  fontSize: 15,
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {getInitials(displayName)}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('myBookings.appointmentWith')} {displayName}
                </Typography>
                {provider?.specialty && (
                  <Typography variant="caption" color="text.secondary">
                    {t(`specialty.${provider.specialty}`)}
                  </Typography>
                )}
              </Box>
            </Stack>

            <Chip
              label={t(`bookingStatus.${booking.status}`)}
              size="small"
              color={STATUS_COLOR[booking.status]}
              variant="outlined"
              sx={{ fontSize: 11, height: 22, flexShrink: 0 }}
            />
          </Stack>

          {/* Appointment time */}
          <Stack direction="row" spacing={1} alignItems="center">
            <EventIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {slotStart.format('ddd, MMM D, YYYY')}
              {' · '}
              {slotStart.format('h:mm A')} – {slotEnd.format('h:mm A')}
            </Typography>
          </Stack>

          {/* Patient notes snippet */}
          {booking.patientNotes && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
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
                {t('myBookings.yourNotes')}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.25 }}>
                {booking.patientNotes}
              </Typography>
            </Box>
          )}

          {/* Footer: booked date + actions */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.disabled">
              {t('myBookings.bookedOn')}{' '}
              {dayjs.utc(booking.createdAt).local().format('MMM D, YYYY')}
            </Typography>

            <Stack direction="row" spacing={1}>
              {canConfirm && (
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => onConfirm!(booking.id)}
                  sx={{ borderRadius: 2 }}
                >
                  {t('myBookings.confirmBooking')}
                </Button>
              )}
              {canJoin && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<VideoCallIcon />}
                  onClick={() => onJoin!(booking.id)}
                  sx={{ borderRadius: 2 }}
                >
                  {t('myBookings.joinSession')}
                </Button>
              )}
              {canCancel && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<CancelOutlinedIcon />}
                  onClick={() => onCancel(booking.id)}
                  sx={{ borderRadius: 2 }}
                >
                  {t('myBookings.cancelAppointment')}
                </Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default BookingCard;
