import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/ui';
import { useDeleteProvider, useProviders } from '@/hooks/useProviders';
import type { Provider } from '@/types/telehealth';

import ProviderFormDialog from './ProviderFormDialog';
import ProviderTable from './ProviderTable';
import SlotManagerDialog from './SlotManagerDialog';

const PAGE_SIZE = 20;

interface ProviderManagementProps {
  ns: string;
}

const ProviderManagement: React.FC<ProviderManagementProps> = ({ ns }) => {
  const { t } = useTranslation(ns);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [formProvider, setFormProvider] = useState<Provider | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);
  const [slotTarget, setSlotTarget] = useState<Provider | null>(null);

  const { data, isLoading } = useProviders({ page, pageSize });
  const deleteProvider = useDeleteProvider();

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteProvider.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <Box>
      <PageHeader
        title={t('providerMgmt.title')}
        subtitle={t('providerMgmt.subtitle')}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormProvider('new')}
            sx={{ borderRadius: 2 }}
          >
            {t('providerMgmt.addProvider')}
          </Button>
        }
      />

      <Stack sx={{ p: 3 }}>
        <ProviderTable
          ns={ns}
          providers={data?.data ?? []}
          total={data?.total ?? 0}
          page={page}
          pageSize={pageSize}
          loading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onEdit={setFormProvider}
          onDelete={setDeleteTarget}
          onManageSlots={setSlotTarget}
        />
      </Stack>

      {/* Create / Edit dialog */}
      <ProviderFormDialog
        ns={ns}
        open={formProvider !== null}
        provider={formProvider === 'new' ? null : formProvider}
        onClose={() => setFormProvider(null)}
      />

      {/* Slot manager dialog */}
      <SlotManagerDialog
        ns={ns}
        open={Boolean(slotTarget)}
        provider={slotTarget}
        onClose={() => setSlotTarget(null)}
      />

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight={600}>{t('providerMgmt.deleteDialogTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('providerMgmt.deleteDialogMessage')}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            {t('actions.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleteProvider.isPending}
            sx={{ borderRadius: 2 }}
          >
            {t('providerMgmt.deleteDialogConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProviderManagement;
