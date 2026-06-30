import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VideocamIcon from '@mui/icons-material/Videocam';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useTranslation } from 'react-i18next';

import type { BookingDetail, BookingStatus, Provider } from '@/types/telehealth';
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

const STATUS_BORDER_COLOR: Record<BookingStatus, string> = {
  pending: 'warning.main',
  confirmed: 'success.main',
  cancelled: 'error.light',
  completed: 'divider',
  no_show: 'error.light'
};

interface BookingCardProps {
  ns: string;
  booking: BookingDetail;
  provider?: Provider;
  onCancel: (id: string) => void;
  onConfirm?: (id: string) => void;
  onJoin?: (id: string) => void;
  onViewDetail?: (id: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  ns,
  booking,
  provider,
  onCancel,
  onConfirm,
  onJoin,
  onViewDetail
}) => {
  const { t } = useTranslation(ns);

  const slotStart = dayjs.utc(booking.slot.startTime).local();
  const slotEnd = dayjs.utc(booking.slot.endTime).local();
  const displayName = provider?.name ?? `Provider …${booking.providerId.slice(-6)}`;

  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const canConfirm = booking.status === 'pending' && Boolean(onConfirm);
  const canJoin =
    booking.status === 'confirmed' && Boolean(onJoin) && Boolean(booking.consultationId);
  const isActive = booking.status === 'pending' || booking.status === 'confirmed';
  const isDimmed = booking.status === 'cancelled' || booking.status === 'no_show';
  const hasActions = canConfirm || canJoin || canCancel;

  return (
    <Card
      variant="outlined"
      onClick={onViewDetail ? () => onViewDetail(booking.id) : undefined}
      sx={{
        borderLeftWidth: 4,
        borderLeftStyle: 'solid',
        borderLeftColor: STATUS_BORDER_COLOR[booking.status],
        transition: 'box-shadow 0.2s, transform 0.15s',
        opacity: isDimmed ? 0.7 : 1,
        ...(onViewDetail && {
          cursor: 'pointer',
          '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
        })
      }}
    >
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Stack direction="row" spacing={2} sx={{ p: 2.5 }}>
          <Avatar
            src={provider?.avatarUrl ?? undefined}
            sx={{
              width: 52,
              height: 52,
              bgcolor: getAvatarColor(displayName),
              fontSize: 17,
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            {getInitials(displayName)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={1}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  {displayName}
                </Typography>
                {provider?.specialty && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {t(`specialty.${provider.specialty}`)}
                  </Typography>
                )}
              </Box>

              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexShrink: 0 }}>
                <Chip
                  label={t(`bookingStatus.${booking.status}`)}
                  size="small"
                  color={STATUS_CHIP_COLOR[booking.status]}
                  variant="filled"
                  sx={{ fontWeight: 600, fontSize: 11 }}
                />
                {onViewDetail && (
                  <ArrowForwardIosIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                )}
              </Stack>
            </Stack>

            {/* Date / time pill */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{
                display: 'inline-flex',
                mt: 1.25,
                px: 1.5,
                py: 0.5,
                borderRadius: 10,
                border: '1px solid',
                bgcolor: isActive ? 'primary.main' : 'background.default',
                borderColor: isActive ? 'transparent' : 'divider',
                color: isActive ? 'primary.contrastText' : 'text.secondary'
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 13 }} />
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ whiteSpace: 'nowrap', lineHeight: 1.3 }}
              >
                {slotStart.format('ddd, MMM D')} · {slotStart.format('h:mm')}–
                {slotEnd.format('h:mm A')}
              </Typography>
            </Stack>

            {booking.patientNotes && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mt: 1.25,
                  fontStyle: 'italic',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                "{booking.patientNotes}"
              </Typography>
            )}
          </Box>
        </Stack>

        {hasActions && (
          <>
            <Divider />
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ px: 2, py: 1.25 }}>
              {canConfirm && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirm?.(booking.id);
                  }}
                >
                  {t('myBookings.confirmBooking')}
                </Button>
              )}
              {canJoin && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<VideocamIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    booking.consultationId && onJoin?.(booking.consultationId);
                  }}
                >
                  {t('myBookings.joinSession')}
                </Button>
              )}
              {canCancel && (
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  startIcon={<CancelOutlinedIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(booking.id);
                  }}
                >
                  {t('myBookings.cancelAppointment')}
                </Button>
              )}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingCard;
