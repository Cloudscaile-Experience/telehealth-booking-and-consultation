import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { Box, Chip, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useProviderSlots } from '@/hooks/useProviders';
import type { AvailabilitySlot } from '@/types/telehealth';

dayjs.extend(utc);

const groupByDate = (slots: AvailabilitySlot[]): Record<string, AvailabilitySlot[]> => {
  const groups: Record<string, AvailabilitySlot[]> = {};
  for (const slot of slots) {
    const key = dayjs.utc(slot.startTime).local().format('YYYY-MM-DD');
    if (!groups[key]) groups[key] = [];
    groups[key].push(slot);
  }
  return groups;
};

const getDateLabel = (dateStr: string, today: string, tomorrow: string): string => {
  const d = dayjs(dateStr);
  const todayStr = dayjs().format('YYYY-MM-DD');
  const tomorrowStr = dayjs().add(1, 'day').format('YYYY-MM-DD');
  if (dateStr === todayStr) return today;
  if (dateStr === tomorrowStr) return tomorrow;
  return d.format('ddd, MMM D');
};

interface SlotPickerProps {
  ns: string;
  providerId: string;
  selectedSlotId: string | null;
  onSelect: (slot: AvailabilitySlot) => void;
}

const SlotPicker: React.FC<SlotPickerProps> = ({ ns, providerId, selectedSlotId, onSelect }) => {
  const { t } = useTranslation(ns);
  const { data, isLoading } = useProviderSlots(providerId);
  const [activeDateIdx, setActiveDateIdx] = useState(0);

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={40} sx={{ borderRadius: 1 }} />
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" width={108} height={32} sx={{ borderRadius: 4 }} />
          ))}
        </Stack>
      </Stack>
    );
  }

  const slots = data?.data ?? [];

  if (!slots.length) {
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
        <EventBusyIcon color="disabled" fontSize="small" />
        <Typography variant="body2" color="text.secondary">
          {t('booking.noSlots')}
        </Typography>
      </Stack>
    );
  }

  const groups = groupByDate(slots);
  const dates = Object.keys(groups).sort();
  const safeIdx = Math.min(activeDateIdx, dates.length - 1);
  const activeDate = dates[safeIdx];
  const slotsForDate = groups[activeDate] ?? [];

  return (
    <Stack spacing={2}>
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          textTransform="uppercase"
          letterSpacing={0.5}
          sx={{ mb: 1, display: 'block' }}
        >
          {t('booking.selectDate')}
        </Typography>
        <Tabs
          value={safeIdx}
          onChange={(_, idx: number) => setActiveDateIdx(idx)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 38,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 36, py: 0.5, px: 1.5, fontSize: 13, fontWeight: 500 }
          }}
        >
          {dates.map((dateStr) => (
            <Tab
              key={dateStr}
              label={getDateLabel(dateStr, t('booking.today'), t('booking.tomorrow'))}
            />
          ))}
        </Tabs>
      </Box>

      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          textTransform="uppercase"
          letterSpacing={0.5}
          sx={{ mb: 1.5, display: 'block' }}
        >
          {t('booking.selectTime')}
        </Typography>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {slotsForDate.map((slot) => {
            const start = dayjs.utc(slot.startTime).local();
            const end = dayjs.utc(slot.endTime).local();
            const isSelected = selectedSlotId === slot.id;
            return (
              <Chip
                key={slot.id}
                icon={<AccessTimeIcon />}
                label={`${start.format('h:mm A')} – ${end.format('h:mm A')}`}
                variant={isSelected ? 'filled' : 'outlined'}
                color={isSelected ? 'primary' : 'default'}
                onClick={() => onSelect(slot)}
                clickable
                sx={{ borderRadius: 2 }}
              />
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
};

export default SlotPicker;
