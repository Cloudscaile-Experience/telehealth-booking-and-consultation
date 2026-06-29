import { Box, Grid, Pagination, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui';
import { useProviders } from '@/hooks/useProviders';
import type { ListProvidersParams, Provider } from '@/types/telehealth';

import ProviderCard from './ProviderCard';
import ProviderCardSkeleton from './ProviderCardSkeleton';
import ProviderFilters from './ProviderFilters';

const PAGE_SIZE = 12;
const SKELETON_KEYS = Array.from({ length: PAGE_SIZE }, (_, i) => `sk-${i}`);

interface ProviderDirectoryProps {
  ns: string;
  onBook: (provider: Provider) => void;
}

const ProviderDirectory: React.FC<ProviderDirectoryProps> = ({ ns, onBook }) => {
  const { t } = useTranslation(ns);
  const [filters, setFilters] = useState<ListProvidersParams>({ page: 1, pageSize: PAGE_SIZE });
  const { data, isLoading } = useProviders(filters);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <Stack spacing={3} sx={{ p: 3 }}>
      <ProviderFilters ns={ns} filters={filters} onChange={setFilters} />

      {!isLoading && data && (
        <Typography variant="body2" color="text.secondary">
          {t('directory.resultCount', { count: data.total })}
        </Typography>
      )}

      {!isLoading && data?.data.length === 0 && (
        <EmptyState
          title={t('directory.emptyTitle')}
          description={t('directory.emptyDescription')}
        />
      )}

      <Grid container spacing={2.5}>
        {isLoading
          ? SKELETON_KEYS.map((key) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                <ProviderCardSkeleton />
              </Grid>
            ))
          : data?.data.map((provider) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={provider.id}>
                <ProviderCard ns={ns} provider={provider} onBook={onBook} />
              </Grid>
            ))}
      </Grid>

      {!isLoading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
          <Pagination
            count={totalPages}
            page={filters.page ?? 1}
            onChange={(_, page) => setFilters((f) => ({ ...f, page }))}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Stack>
  );
};

export default ProviderDirectory;
