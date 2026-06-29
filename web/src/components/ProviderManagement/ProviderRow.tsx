import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { Provider } from '@/types/telehealth';
import { getAvatarColor, getInitials } from '@/utils/helpers';

interface ProviderRowProps {
  ns: string;
  provider: Provider;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onManageSlots: (provider: Provider) => void;
}

const ProviderRow: React.FC<ProviderRowProps> = ({
  ns,
  provider,
  onEdit,
  onDelete,
  onManageSlots
}) => {
  const { t } = useTranslation(ns);

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <TableRow
      hover
      sx={{
        cursor: 'default',
        '&:hover .row-actions': { opacity: 1 }
      }}
    >
      {/* Provider */}
      <TableCell sx={{ py: 1.5, px: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            src={provider.avatarUrl ?? undefined}
            sx={{
              width: 36,
              height: 36,
              bgcolor: getAvatarColor(provider.name),
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            {getInitials(provider.name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {provider.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {provider.email}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      {/* Specialty */}
      <TableCell sx={{ px: 2 }}>
        <Chip
          label={t(`specialty.${provider.specialty}`)}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontSize: 11, height: 22 }}
        />
      </TableCell>

      {/* Fee */}
      <TableCell sx={{ px: 2 }}>
        <Typography variant="body2" fontWeight={600} color="primary.main">
          {provider.consultationFee > 0
            ? `$${provider.consultationFee.toFixed(2)}`
            : t('card.free')}
        </Typography>
      </TableCell>

      {/* Rating */}
      <TableCell sx={{ px: 2 }}>
        <Typography variant="body2">
          {provider.rating > 0 ? `★ ${provider.rating.toFixed(1)}` : '—'}
        </Typography>
      </TableCell>

      {/* Status */}
      <TableCell sx={{ px: 2 }}>
        <Chip
          label={
            provider.isActive
              ? t('providerMgmt.statusLabel.active')
              : t('providerMgmt.statusLabel.inactive')
          }
          size="small"
          color={provider.isActive ? 'success' : 'default'}
          variant="outlined"
          sx={{ fontSize: 11, height: 22 }}
        />
      </TableCell>

      {/* Actions */}
      <TableCell align="right" sx={{ px: 2 }}>
        <Stack
          direction="row"
          spacing={0.25}
          justifyContent="flex-end"
          className="row-actions"
          sx={{ opacity: 0, transition: 'opacity 0.15s' }}
        >
          <Tooltip title={t('providerMgmt.actions.manageSlots')}>
            <IconButton size="small" color="primary" onClick={stop(() => onManageSlots(provider))}>
              <CalendarMonthIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('providerMgmt.actions.edit')}>
            <IconButton size="small" onClick={stop(() => onEdit(provider))}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('providerMgmt.actions.delete')}>
            <IconButton size="small" color="error" onClick={stop(() => onDelete(provider))}>
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

export default ProviderRow;
