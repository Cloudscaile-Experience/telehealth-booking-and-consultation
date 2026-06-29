import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';

import { useCreateProvider, useUpdateProvider } from '@/hooks/useProviders';
import type { CreateProviderPayload, Provider, ProviderSpecialty } from '@/types/telehealth';

const SPECIALTIES: ProviderSpecialty[] = [
  'general_practitioner',
  'cardiologist',
  'dermatologist',
  'endocrinologist',
  'neurologist',
  'oncologist',
  'orthopedist',
  'pediatrician',
  'psychiatrist',
  'psychologist',
  'radiologist',
  'therapist'
];

const providerSchema = (t: (key: string) => string) =>
  Yup.object({
    name: Yup.string().min(1).max(255).required(t('providerMgmt.form.nameRequired')),
    email: Yup.string()
      .email(t('providerMgmt.form.emailInvalid'))
      .required(t('providerMgmt.form.emailRequired')),
    specialty: Yup.string().required(t('providerMgmt.form.specialtyRequired')),
    bio: Yup.string().optional(),
    avatarUrl: Yup.string().url(t('providerMgmt.form.avatarInvalid')).optional().nullable(),
    languages: Yup.string().max(500).optional(),
    consultationFee: Yup.number().min(0, t('providerMgmt.form.feeMin')).optional()
  });

interface ProviderFormDialogProps {
  ns: string;
  open: boolean;
  provider: Provider | null;
  onClose: () => void;
}

const ProviderFormDialog: React.FC<ProviderFormDialogProps> = ({ ns, open, provider, onClose }) => {
  const { t } = useTranslation(ns);
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();

  const isEdit = Boolean(provider);

  const formik = useFormik({
    initialValues: {
      name: provider?.name ?? '',
      email: provider?.email ?? '',
      specialty: provider?.specialty ?? ('' as ProviderSpecialty),
      bio: provider?.bio ?? '',
      avatarUrl: provider?.avatarUrl ?? '',
      languages: provider?.languages ?? 'English',
      consultationFee: provider?.consultationFee ?? 0
    },
    enableReinitialize: true,
    validationSchema: providerSchema(t),
    onSubmit: async (values) => {
      const payload: CreateProviderPayload = {
        name: values.name,
        email: values.email,
        specialty: values.specialty as ProviderSpecialty,
        bio: values.bio || undefined,
        avatarUrl: values.avatarUrl || undefined,
        languages: values.languages || undefined,
        consultationFee: values.consultationFee
      };

      if (isEdit && provider) {
        await updateProvider.mutateAsync({ id: provider.id, payload });
      } else {
        await createProvider.mutateAsync(payload);
      }
      onClose();
    }
  });

  const isPending = createProvider.isPending || updateProvider.isPending;

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600}>
          {isEdit ? t('providerMgmt.form.editTitle') : t('providerMgmt.form.createTitle')}
        </Typography>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('providerMgmt.form.name')}
                  {...formik.getFieldProps('name')}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label={t('providerMgmt.form.specialty')}
                  {...formik.getFieldProps('specialty')}
                  error={formik.touched.specialty && Boolean(formik.errors.specialty)}
                  helperText={formik.touched.specialty && formik.errors.specialty}
                >
                  {SPECIALTIES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {t(`specialty.${s}`)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              size="small"
              label={t('providerMgmt.form.email')}
              type="email"
              {...formik.getFieldProps('email')}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              label={t('providerMgmt.form.bio')}
              placeholder={t('providerMgmt.form.bioPlaceholder')}
              {...formik.getFieldProps('bio')}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('providerMgmt.form.languages')}
                  helperText={t('providerMgmt.form.languagesHint')}
                  {...formik.getFieldProps('languages')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={t('providerMgmt.form.fee')}
                  inputProps={{ min: 0, step: 0.01 }}
                  {...formik.getFieldProps('consultationFee')}
                  error={formik.touched.consultationFee && Boolean(formik.errors.consultationFee)}
                  helperText={formik.touched.consultationFee && formik.errors.consultationFee}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              size="small"
              label={t('providerMgmt.form.avatarUrl')}
              {...formik.getFieldProps('avatarUrl')}
              error={formik.touched.avatarUrl && Boolean(formik.errors.avatarUrl)}
              helperText={formik.touched.avatarUrl && formik.errors.avatarUrl}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleClose} color="inherit" disabled={isPending}>
            {t('actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isPending || !formik.isValid}
            startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ minWidth: 140, borderRadius: 2 }}
          >
            {t('providerMgmt.form.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProviderFormDialog;
