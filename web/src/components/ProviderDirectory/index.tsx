import { Box, Grid, Pagination, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState, LoadingSpinner } from '@/components/ui';
import { useProviders } from '@/hooks/useProviders';
import type { ListProvidersParams, Provider } from '@/types/telehealth';

import ProviderCard from './ProviderCard';
import ProviderFilters from './ProviderFilters';

interface ProviderDirectoryProps {
  ns: string;
  onBook: (provider: Provider) => void;
}

const ProviderDirectory: React.FC<ProviderDirectoryProps> = ({ ns, onBook }) => {
  const { t } = useTranslation(ns);

  const [filters, setFilters] = useState<ListProvidersParams>({ page: 1, pageSize: 12 });
  const { data, isLoading } = useProviders(filters);

  const totalPages = data ? Math.ceil(data.total / (filters.pageSize ?? 12)) : 0;

  return (
    <Stack spacing={3} sx={{ p: 3 }}>
      <ProviderFilters ns={ns} filters={filters} onChange={setFilters} />

      {isLoading ? (
        <LoadingSpinner fullHeight label={t('directory.loading')} />
      ) : !data?.data.length ? (
        <EmptyState
          title={t('directory.emptyTitle')}
          description={t('directory.emptyDescription')}
        />
      ) : (
        <>
          <Typography variant="body2" color="text.secondary">
            {t('directory.resultCount', { count: data.total })}
          </Typography>

          <Grid container spacing={2}>
            {data.data.map((provider) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={provider.id}>
                <ProviderCard ns={ns} provider={provider} onBook={onBook} />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={filters.page ?? 1}
                onChange={(_, page) => setFilters((f) => ({ ...f, page }))}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Stack>
  );
};

export default ProviderDirectory;
