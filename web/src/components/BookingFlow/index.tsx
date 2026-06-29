import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateBooking } from '@/hooks/useBookings';
import type { AvailabilitySlot, Provider } from '@/types/telehealth';
import { getAvatarColor, getInitials } from '@/utils/helpers';

import SlotPicker from './SlotPicker';

interface BookingFlowProps {
  ns: string;
  provider: Provider | null;
  onClose: () => void;
}

const BookingFlow: React.FC<BookingFlowProps> = ({ ns, provider, onClose }) => {
  const { t } = useTranslation(ns);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [notes, setNotes] = useState('');

  const createBooking = useCreateBooking();

  const handleClose = () => {
    setSelectedSlot(null);
    setNotes('');
    onClose();
  };

  const handleBook = async () => {
    if (!provider || !selectedSlot) return;
    await createBooking.mutateAsync({
      providerId: provider.id,
      slotId: selectedSlot.id,
      patientNotes: notes || undefined
    });
    handleClose();
  };

  if (!provider) return null;

  return (
    <Dialog open={Boolean(provider)} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <CalendarMonthIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>
          {t('booking.title')}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          {/* Provider summary */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.default',
              border: 1,
              borderColor: 'divider'
            }}
          >
            <Avatar
              src={provider.avatarUrl ?? undefined}
              sx={{
                width: 52,
                height: 52,
                bgcolor: getAvatarColor(provider.name),
                fontSize: 18,
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {getInitials(provider.name)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {provider.name}
              </Typography>
              <Chip
                label={t(`specialty.${provider.specialty}`)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mt: 0.25, fontSize: 11, height: 20 }}
              />
            </Box>

            {provider.consultationFee > 0 && (
              <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <MonetizationOnOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="h6" color="primary.main" fontWeight={700}>
                    ${provider.consultationFee.toFixed(2)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {t('booking.feeNotice')}
                </Typography>
              </Stack>
            )}
          </Stack>

          <Divider />

          <SlotPicker
            key={provider.id}
            ns={ns}
            providerId={provider.id}
            selectedSlotId={selectedSlot?.id ?? null}
            onSelect={setSelectedSlot}
          />

          <TextField
            multiline
            rows={3}
            fullWidth
            label={t('booking.notesLabel')}
            placeholder={t('booking.notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            inputProps={{ maxLength: 1000 }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleClose} disabled={createBooking.isPending} color="inherit">
          {t('actions.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleBook}
          disabled={!selectedSlot || createBooking.isPending}
          startIcon={
            createBooking.isPending ? <CircularProgress size={16} color="inherit" /> : undefined
          }
          sx={{ minWidth: 160, borderRadius: 2 }}
        >
          {t('booking.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingFlow;
