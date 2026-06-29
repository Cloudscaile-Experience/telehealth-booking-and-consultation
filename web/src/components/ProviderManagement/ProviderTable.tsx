import {
  Box,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui';
import type { Provider } from '@/types/telehealth';

import ProviderRow from './ProviderRow';

interface ColDef {
  key: string;
  width: string;
  align?: 'right';
}

const COLUMNS: ColDef[] = [
  { key: 'providerMgmt.table.provider', width: '34%' },
  { key: 'providerMgmt.table.specialty', width: '20%' },
  { key: 'providerMgmt.table.fee', width: '10%' },
  { key: 'providerMgmt.table.rating', width: '10%' },
  { key: 'providerMgmt.table.status', width: '12%' },
  { key: 'providerMgmt.table.actions', width: '14%', align: 'right' }
];

const SKELETON_ROWS = ['sk-a', 'sk-b', 'sk-c', 'sk-d', 'sk-e'];

interface ProviderTableProps {
  ns: string;
  providers: Provider[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onManageSlots: (provider: Provider) => void;
}

const ProviderTable: React.FC<ProviderTableProps> = ({
  ns,
  providers,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onManageSlots
}) => {
  const { t } = useTranslation(ns);

  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              {COLUMNS.map(({ key, width, align }) => (
                <TableCell key={key} align={align ?? 'left'} sx={{ width, py: 1.25, px: 2 }}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    textTransform="uppercase"
                    letterSpacing={0.5}
                  >
                    {t(key)}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading &&
              SKELETON_ROWS.map((key) => (
                <TableRow key={key}>
                  <TableCell sx={{ py: 1.5, px: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Skeleton variant="circular" width={36} height={36} />
                      <Box>
                        <Skeleton variant="text" width={120} height={16} />
                        <Skeleton variant="text" width={160} height={13} sx={{ mt: 0.5 }} />
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ px: 2 }}>
                    <Skeleton variant="rounded" width={100} height={22} sx={{ borderRadius: 10 }} />
                  </TableCell>
                  <TableCell sx={{ px: 2 }}>
                    <Skeleton variant="text" width={50} />
                  </TableCell>
                  <TableCell sx={{ px: 2 }}>
                    <Skeleton variant="text" width={40} />
                  </TableCell>
                  <TableCell sx={{ px: 2 }}>
                    <Skeleton variant="rounded" width={60} height={22} sx={{ borderRadius: 10 }} />
                  </TableCell>
                  <TableCell sx={{ px: 2 }} />
                </TableRow>
              ))}

            {!loading && providers.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} sx={{ border: 0, py: 4 }}>
                  <EmptyState
                    title={t('providerMgmt.table.noResults')}
                    description={t('providerMgmt.table.noResultsHint')}
                  />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              providers.map((provider) => (
                <ProviderRow
                  key={provider.id}
                  ns={ns}
                  provider={provider}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onManageSlots={onManageSlots}
                />
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage={t('providerMgmt.table.rowsPerPage')}
          onPageChange={(_, newPage) => onPageChange(newPage + 1)}
          onRowsPerPageChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
        />
      </Box>
    </Paper>
  );
};

export default ProviderTable;
