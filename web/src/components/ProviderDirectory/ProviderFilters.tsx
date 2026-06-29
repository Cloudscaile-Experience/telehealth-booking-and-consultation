import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { Chip, IconButton, InputAdornment, MenuItem, Stack, TextField } from '@mui/material';
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

  const activeCount = [filters.search, filters.specialty, filters.language].filter(Boolean).length;

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
      <TextField
        size="small"
        placeholder={t('filters.searchPlaceholder')}
        value={filters.search ?? ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value || undefined, page: 1 })}
        sx={{ flex: 1, minWidth: 220 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: filters.search ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                edge="end"
                onClick={() => onChange({ ...filters, search: undefined, page: 1 })}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null
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
        sx={{ minWidth: 150 }}
        InputProps={{
          endAdornment: filters.language ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                edge="end"
                onClick={() => onChange({ ...filters, language: undefined, page: 1 })}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null
        }}
      />

      {activeCount > 0 && (
        <Chip
          label={t('filters.clearFilters')}
          size="small"
          variant="outlined"
          onDelete={() => onChange({ page: 1, pageSize: filters.pageSize })}
          onClick={() => onChange({ page: 1, pageSize: filters.pageSize })}
        />
      )}
    </Stack>
  );
};

export default ProviderFilters;
