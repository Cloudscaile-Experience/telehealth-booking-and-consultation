import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, MenuItem, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { ListProvidersParams, ProviderSpecialty } from '@/types/telehealth';

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

interface ProviderFiltersProps {
  ns: string;
  filters: ListProvidersParams;
  onChange: (filters: ListProvidersParams) => void;
}

const ProviderFilters: React.FC<ProviderFiltersProps> = ({ ns, filters, onChange }) => {
  const { t } = useTranslation(ns);

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
      <TextField
        size="small"
        placeholder={t('filters.searchPlaceholder')}
        value={filters.search ?? ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value || undefined, page: 1 })}
        sx={{ minWidth: 240 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          )
        }}
      />

      <TextField
        select
        size="small"
        label={t('filters.specialty')}
        value={filters.specialty ?? ''}
        onChange={(e) =>
          onChange({
            ...filters,
            specialty: (e.target.value as ProviderSpecialty) || undefined,
            page: 1
          })
        }
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">{t('filters.allSpecialties')}</MenuItem>
        {SPECIALTIES.map((s) => (
          <MenuItem key={s} value={s}>
            {t(`specialty.${s}`)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        size="small"
        label={t('filters.language')}
        value={filters.language ?? ''}
        onChange={(e) => onChange({ ...filters, language: e.target.value || undefined, page: 1 })}
        sx={{ minWidth: 160 }}
      />
    </Stack>
  );
};

export default ProviderFilters;
