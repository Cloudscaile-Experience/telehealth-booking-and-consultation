import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {
  Avatar,
  Button,
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

  const initials = provider.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={Boolean(provider)} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CalendarMonthIcon color="primary" />
        {t('booking.title')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Provider info */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={provider.avatarUrl ?? undefined} sx={{ width: 48, height: 48 }}>
              {initials}
            </Avatar>
            <Stack>
              <Typography variant="subtitle1" fontWeight={600}>
                {provider.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t(`specialty.${provider.specialty}`)}
              </Typography>
            </Stack>
          </Stack>

          <Divider />

          {/* Slot picker */}
          <SlotPicker
            ns={ns}
            providerId={provider.id}
            selectedSlotId={selectedSlot?.id ?? null}
            onSelect={setSelectedSlot}
          />

          {/* Notes */}
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

      <DialogActions>
        <Button onClick={handleClose} disabled={createBooking.isPending}>
          {t('actions.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleBook}
          disabled={!selectedSlot || createBooking.isPending}
        >
          {t('booking.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingFlow;
