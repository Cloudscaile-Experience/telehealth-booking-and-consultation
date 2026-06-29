import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LoadingSpinner } from '@/components/ui';
import { useCreateSlot, useDeleteSlot, useProviderSlots } from '@/hooks/useProviders';
import type { Provider } from '@/types/telehealth';

dayjs.extend(utc);

const toLocalInputValue = (iso: string): string =>
  dayjs.utc(iso).local().format('YYYY-MM-DDTHH:mm');

interface SlotManagerDialogProps {
  ns: string;
  open: boolean;
  provider: Provider | null;
  onClose: () => void;
}

const SlotManagerDialog: React.FC<SlotManagerDialogProps> = ({ ns, open, provider, onClose }) => {
  const { t } = useTranslation(ns);
  const [showAddForm, setShowAddForm] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isLoading } = useProviderSlots(provider?.id ?? '', { includeBooked: true });
  const createSlot = useCreateSlot(provider?.id ?? '');
  const deleteSlot = useDeleteSlot(provider?.id ?? '');

  const slots = data?.data ?? [];

  const handleAddSlot = async () => {
    if (!startTime || !endTime) return;
    await createSlot.mutateAsync({
      startTime: dayjs(startTime).toISOString(),
      endTime: dayjs(endTime).toISOString()
    });
    setStartTime('');
    setEndTime('');
    setShowAddForm(false);
  };

  const handleDelete = async (slotId: string) => {
    setDeleteTarget(slotId);
    await deleteSlot.mutateAsync(slotId);
    setDeleteTarget(null);
  };

  const handleClose = () => {
    setShowAddForm(false);
    setStartTime('');
    setEndTime('');
    onClose();
  };

  if (!provider) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600}>
          {t('providerMgmt.slots.title', { name: provider.name })}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {isLoading ? (
          <LoadingSpinner label="Loading slots..." />
        ) : slots.length === 0 && !showAddForm ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <EventBusyIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" fontWeight={600}>
              {t('providerMgmt.slots.noSlots')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('providerMgmt.slots.noSlotsHint')}
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Divider />}>
            {slots.map((slot) => {
              const start = dayjs.utc(slot.startTime).local();
              const end = dayjs.utc(slot.endTime).local();
              const isDeleting = deleteTarget === slot.id;

              return (
                <Stack
                  key={slot.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ px: 3, py: 1.5 }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {start.format('ddd, MMM D, YYYY')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {start.format('h:mm A')} – {end.format('h:mm A')}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={
                        slot.isBooked
                          ? t('providerMgmt.slots.booked')
                          : t('providerMgmt.slots.available')
                      }
                      size="small"
                      color={slot.isBooked ? 'warning' : 'success'}
                      variant="outlined"
                      sx={{ fontSize: 11, height: 22 }}
                    />
                    {!slot.isBooked && (
                      <Tooltip title={t('providerMgmt.slots.deleteSlotConfirm')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(slot.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        )}

        {/* Add slot form */}
        {showAddForm && (
          <>
            <Divider />
            <Stack spacing={2} sx={{ p: 3 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {t('providerMgmt.slots.addDialogTitle')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="datetime-local"
                  label={t('providerMgmt.slots.startTime')}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: toLocalInputValue(new Date().toISOString()) }}
                />
                <TextField
                  fullWidth
                  size="small"
                  type="datetime-local"
                  label={t('providerMgmt.slots.endTime')}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: startTime || toLocalInputValue(new Date().toISOString()) }}
                />
              </Stack>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => {
                    setShowAddForm(false);
                    setStartTime('');
                    setEndTime('');
                  }}
                >
                  {t('actions.cancel')}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleAddSlot}
                  disabled={!startTime || !endTime || createSlot.isPending}
                  startIcon={
                    createSlot.isPending ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : undefined
                  }
                  sx={{ borderRadius: 2 }}
                >
                  {t('providerMgmt.slots.addSlot')}
                </Button>
              </Stack>
            </Stack>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        {!showAddForm && (
          <Button startIcon={<AddIcon />} onClick={() => setShowAddForm(true)} sx={{ mr: 'auto' }}>
            {t('providerMgmt.slots.addSlot')}
          </Button>
        )}
        <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>
          {t('actions.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SlotManagerDialog;
