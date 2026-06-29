import CallEndIcon from '@mui/icons-material/CallEnd';
import RefreshIcon from '@mui/icons-material/Refresh';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useEndConsultation,
  useRefreshVideoToken,
  useStartConsultation,
  useUpdateConsultationNotes,
  useUpdateSummary
} from '@/hooks/useConsultations';
import type { Consultation, VideoToken } from '@/types/telehealth';

dayjs.extend(utc);

const AUTO_SAVE_DELAY = 1500;

const STATUS_COLOR = {
  scheduled: 'warning' as const,
  in_progress: 'success' as const,
  completed: 'default' as const,
  cancelled: 'error' as const
};

interface ConsultationRoomProps {
  ns: string;
  consultation: Consultation;
  onEnded: () => void;
}

const ConsultationRoom: React.FC<ConsultationRoomProps> = ({ ns, consultation, onEnded }) => {
  const { t } = useTranslation(ns);

  const [videoToken, setVideoToken] = useState<VideoToken | null>(null);
  const [patientNotes, setPatientNotes] = useState(consultation.patientNotes ?? '');
  const [providerNotes, setProviderNotes] = useState(consultation.providerNotes ?? '');
  const [summary, setSummary] = useState(consultation.summary ?? '');
  const [summaryDirty, setSummaryDirty] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const notesTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const startConsultation = useStartConsultation();
  const endConsultation = useEndConsultation();
  const updateNotes = useUpdateConsultationNotes();
  const updateSummary = useUpdateSummary();
  const refreshToken = useRefreshVideoToken();

  const isCompleted = consultation.status === 'completed';
  const isInProgress = consultation.status === 'in_progress';
  const isCancelled = consultation.status === 'cancelled';

  useEffect(() => {
    return () => {
      if (notesTimer.current) clearTimeout(notesTimer.current);
    };
  }, []);

  const scheduleNotesSave = (nextPatient: string, nextProvider: string) => {
    if (notesTimer.current) clearTimeout(notesTimer.current);
    setIsSavingNotes(false);
    notesTimer.current = setTimeout(async () => {
      setIsSavingNotes(true);
      await updateNotes.mutateAsync({
        id: consultation.id,
        payload: { patientNotes: nextPatient, providerNotes: nextProvider }
      });
      setIsSavingNotes(false);
    }, AUTO_SAVE_DELAY);
  };

  const handlePatientNotesChange = (value: string) => {
    setPatientNotes(value);
    scheduleNotesSave(value, providerNotes);
  };

  const handleProviderNotesChange = (value: string) => {
    setProviderNotes(value);
    scheduleNotesSave(patientNotes, value);
  };

  const handleStart = async () => {
    const token = await startConsultation.mutateAsync(consultation.id);
    setVideoToken(token);
  };

  const handleEnd = async () => {
    await endConsultation.mutateAsync(consultation.id);
    onEnded();
  };

  const handleRefreshToken = async () => {
    const token = await refreshToken.mutateAsync(consultation.id);
    setVideoToken(token);
  };

  const handleSaveSummary = async () => {
    await updateSummary.mutateAsync({ id: consultation.id, payload: { summary } });
    setSummaryDirty(false);
  };

  const duration =
    consultation.startedAt && consultation.endedAt
      ? dayjs.utc(consultation.endedAt).diff(dayjs.utc(consultation.startedAt), 'minute')
      : null;

  return (
    <Stack spacing={3} sx={{ p: 3, maxWidth: 860, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {t('room.title')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {t('room.sessionId')}: {consultation.videoSessionId}
          </Typography>
        </Box>
        <Chip
          label={t(`consultationStatus.${consultation.status}`)}
          color={STATUS_COLOR[consultation.status]}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Stack>

      {/* Timing row */}
      {consultation.startedAt && (
        <Stack direction="row" spacing={3}>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              {t('room.started')}
            </Typography>
            <Typography variant="body2">
              {dayjs.utc(consultation.startedAt).local().format('MMM D, YYYY h:mm A')}
            </Typography>
          </Box>
          {consultation.endedAt && (
            <>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  textTransform="uppercase"
                  letterSpacing={0.5}
                >
                  {t('room.ended')}
                </Typography>
                <Typography variant="body2">
                  {dayjs.utc(consultation.endedAt).local().format('MMM D, YYYY h:mm A')}
                </Typography>
              </Box>
              {duration !== null && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    textTransform="uppercase"
                    letterSpacing={0.5}
                  >
                    {t('room.duration')}
                  </Typography>
                  <Typography variant="body2">{duration} min</Typography>
                </Box>
              )}
            </>
          )}
        </Stack>
      )}

      <Divider />

      {/* Video session panel */}
      {!isCancelled && (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: isInProgress ? 'success.light' : 'background.default',
            opacity: isCompleted ? 0.7 : 1
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              {isInProgress || videoToken ? (
                <VideocamIcon color="success" />
              ) : (
                <VideocamOffIcon color="disabled" />
              )}
              <Typography variant="subtitle2" fontWeight={700}>
                {t('room.videoSession')}
              </Typography>
            </Stack>

            {!isCompleted && !isInProgress && !videoToken && (
              <Alert severity="info" variant="outlined" icon={false}>
                {t('room.sessionReady')}
              </Alert>
            )}

            {(isInProgress || videoToken) && (
              <Alert
                severity={videoToken ? 'success' : 'info'}
                variant="outlined"
                icon={<VideocamIcon fontSize="small" />}
              >
                {videoToken ? (
                  <>
                    {t('room.sessionActive')} — <strong>{t('room.tokenExpiresAt')}: </strong>
                    {dayjs.utc(videoToken.expiresAt).local().format('h:mm A')}
                  </>
                ) : (
                  t('room.sessionInProgress')
                )}
              </Alert>
            )}

            {!isCompleted && (
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                {!isInProgress && !videoToken && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={
                      startConsultation.isPending ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <VideocamIcon />
                      )
                    }
                    onClick={handleStart}
                    disabled={startConsultation.isPending}
                    sx={{ borderRadius: 2 }}
                  >
                    {t('room.startSession')}
                  </Button>
                )}

                {videoToken && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefreshToken}
                    disabled={refreshToken.isPending}
                    sx={{ borderRadius: 2 }}
                  >
                    {t('room.refreshToken')}
                  </Button>
                )}

                {isInProgress && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CallEndIcon />}
                    onClick={handleEnd}
                    disabled={endConsultation.isPending}
                    sx={{ borderRadius: 2 }}
                  >
                    {t('room.endSession')}
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        </Paper>
      )}

      {/* Notes */}
      <Stack spacing={3}>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight={600}>
              {t('room.patientNotes')}
            </Typography>
            {isSavingNotes && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <CircularProgress size={12} />
                <Typography variant="caption" color="text.secondary">
                  {t('room.autoSaving')}
                </Typography>
              </Stack>
            )}
          </Stack>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={patientNotes}
            onChange={(e) => handlePatientNotesChange(e.target.value)}
            placeholder={t('room.notesPlaceholder')}
            disabled={isCompleted}
            inputProps={{ maxLength: 5000 }}
          />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2" fontWeight={600}>
            {t('room.providerNotes')}
          </Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={providerNotes}
            onChange={(e) => handleProviderNotesChange(e.target.value)}
            placeholder={t('room.providerNotesPlaceholder')}
            disabled={isCompleted}
            inputProps={{ maxLength: 5000 }}
          />
        </Stack>
      </Stack>

      {/* Post-visit summary */}
      {isCompleted && (
        <>
          <Divider />
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={600}>
              {t('room.summary')}
            </Typography>
            <TextField
              multiline
              rows={5}
              fullWidth
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                setSummaryDirty(true);
              }}
              placeholder={t('room.summaryPlaceholder')}
              inputProps={{ maxLength: 5000 }}
            />
            {summaryDirty && (
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveSummary}
                disabled={updateSummary.isPending || !summary.trim()}
                sx={{ alignSelf: 'flex-end', borderRadius: 2 }}
              >
                {t('actions.save')}
              </Button>
            )}
          </Stack>
        </>
      )}
    </Stack>
  );
};

export default ConsultationRoom;
