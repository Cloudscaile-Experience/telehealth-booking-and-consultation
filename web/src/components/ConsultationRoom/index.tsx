import CallEndIcon from '@mui/icons-material/CallEnd';
import VideocamIcon from '@mui/icons-material/Videocam';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useEndConsultation,
  useStartConsultation,
  useUpdateConsultationNotes,
  useUpdateSummary
} from '@/hooks/useConsultations';
import type { Consultation, VideoToken } from '@/types/telehealth';
import { dateTimeView } from '@/utils/dateTime';

interface ConsultationRoomProps {
  ns: string;
  consultation: Consultation;
  onEnded: () => void;
}

const ConsultationRoom: React.FC<ConsultationRoomProps> = ({ ns, consultation, onEnded }) => {
  const { t } = useTranslation(ns);

  const [videoToken, setVideoToken] = useState<VideoToken | null>(null);
  const [patientNotes, setPatientNotes] = useState(consultation.patientNotes ?? '');
  const [summary, setSummary] = useState(consultation.summary ?? '');
  const [notesDirty, setNotesDirty] = useState(false);
  const [summaryDirty, setSummaryDirty] = useState(false);

  const startConsultation = useStartConsultation();
  const endConsultation = useEndConsultation();
  const updateNotes = useUpdateConsultationNotes();
  const updateSummary = useUpdateSummary();

  const isCompleted = consultation.status === 'completed';
  const isInProgress = consultation.status === 'in_progress';

  const handleStart = async () => {
    const token = await startConsultation.mutateAsync(consultation.id);
    setVideoToken(token);
  };

  const handleEnd = async () => {
    await endConsultation.mutateAsync(consultation.id);
    onEnded();
  };

  const handleSaveNotes = async () => {
    await updateNotes.mutateAsync({
      id: consultation.id,
      payload: { patientNotes }
    });
    setNotesDirty(false);
  };

  const handleSaveSummary = async () => {
    await updateSummary.mutateAsync({ id: consultation.id, payload: { summary } });
    setSummaryDirty(false);
  };

  return (
    <Stack spacing={3} sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack>
          <Typography variant="h6">{t('room.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('room.sessionId')}: {consultation.videoSessionId}
          </Typography>
        </Stack>
        <Chip
          label={t(`consultationStatus.${consultation.status}`)}
          color={isInProgress ? 'success' : isCompleted ? 'default' : 'warning'}
          variant="outlined"
        />
      </Stack>

      {/* Session timing */}
      {consultation.startedAt && (
        <Typography variant="body2" color="text.secondary">
          {t('room.started')}: {dateTimeView(consultation.startedAt)}
          {consultation.endedAt && ` · ${t('room.ended')}: ${dateTimeView(consultation.endedAt)}`}
        </Typography>
      )}

      <Divider />

      {/* Video session control */}
      {!isCompleted && (
        <Box>
          {videoToken ? (
            <Alert severity="success" icon={<VideocamIcon />}>
              {t('room.sessionActive')} — {t('room.tokenExpiresAt')}:{' '}
              {dateTimeView(videoToken.expiresAt)}
            </Alert>
          ) : isInProgress ? (
            <Alert severity="info" icon={<VideocamIcon />}>
              {t('room.sessionInProgress')}
            </Alert>
          ) : (
            <Button
              variant="contained"
              color="success"
              startIcon={
                startConsultation.isPending ? <CircularProgress size={16} /> : <VideocamIcon />
              }
              onClick={handleStart}
              disabled={startConsultation.isPending}
            >
              {t('room.startSession')}
            </Button>
          )}
        </Box>
      )}

      {/* Notes */}
      <Stack spacing={1}>
        <Typography variant="subtitle2">{t('room.patientNotes')}</Typography>
        <TextField
          multiline
          rows={4}
          fullWidth
          value={patientNotes}
          onChange={(e) => {
            setPatientNotes(e.target.value);
            setNotesDirty(true);
          }}
          placeholder={t('room.notesPlaceholder')}
          disabled={isCompleted}
        />
        {notesDirty && (
          <Button
            size="small"
            variant="outlined"
            onClick={handleSaveNotes}
            disabled={updateNotes.isPending}
            sx={{ alignSelf: 'flex-end' }}
          >
            {t('actions.save')}
          </Button>
        )}
      </Stack>

      {/* Post-visit summary */}
      {isCompleted && (
        <>
          <Divider />
          <Stack spacing={1}>
            <Typography variant="subtitle2">{t('room.summary')}</Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                setSummaryDirty(true);
              }}
              placeholder={t('room.summaryPlaceholder')}
            />
            {summaryDirty && (
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveSummary}
                disabled={updateSummary.isPending || !summary.trim()}
                sx={{ alignSelf: 'flex-end' }}
              >
                {t('actions.save')}
              </Button>
            )}
          </Stack>
        </>
      )}

      {/* End consultation */}
      {isInProgress && (
        <>
          <Divider />
          <Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CallEndIcon />}
              onClick={handleEnd}
              disabled={endConsultation.isPending}
            >
              {t('room.endSession')}
            </Button>
          </Box>
        </>
      )}
    </Stack>
  );
};

export default ConsultationRoom;
