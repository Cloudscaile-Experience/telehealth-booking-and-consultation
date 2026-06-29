import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Box, Chip, Skeleton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useProviderSlots } from '@/hooks/useProviders';
import type { AvailabilitySlot } from '@/types/telehealth';
import { dateTimeView } from '@/utils/dateTime';

interface SlotPickerProps {
  ns: string;
  providerId: string;
  selectedSlotId: string | null;
  onSelect: (slot: AvailabilitySlot) => void;
}

const SlotPicker: React.FC<SlotPickerProps> = ({ ns, providerId, selectedSlotId, onSelect }) => {
  const { t } = useTranslation(ns);
  const { data, isLoading } = useProviderSlots(providerId);

  if (isLoading) {
    return (
      <Stack spacing={1}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={40} />
        ))}
      </Stack>
    );
  }

  const slots = data?.data ?? [];

  if (!slots.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('booking.noSlots')}
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        {t('booking.selectSlot')}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        {slots.map((slot) => (
          <Chip
            key={slot.id}
            icon={<AccessTimeIcon />}
            label={`${dateTimeView(slot.startTime)} – ${dateTimeView(slot.endTime).split(' ').slice(-2).join(' ')}`}
            variant={selectedSlotId === slot.id ? 'filled' : 'outlined'}
            color={selectedSlotId === slot.id ? 'primary' : 'default'}
            onClick={() => onSelect(slot)}
            clickable
          />
        ))}
      </Stack>
    </Box>
  );
};

export default SlotPicker;
