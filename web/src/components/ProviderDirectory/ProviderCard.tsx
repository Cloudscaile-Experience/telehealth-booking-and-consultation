import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LanguageIcon from '@mui/icons-material/Language';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { Provider } from '@/types/telehealth';
import { getAvatarColor, getInitials } from '@/utils/helpers';

interface ProviderCardProps {
  ns: string;
  provider: Provider;
  onBook: (provider: Provider) => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ ns, provider, onBook }) => {
  const { t } = useTranslation(ns);

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': { boxShadow: 4, borderColor: 'primary.main' }
      }}
    >
      <CardContent sx={{ flex: 1, p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar
              src={provider.avatarUrl ?? undefined}
              sx={{
                width: 64,
                height: 64,
                bgcolor: getAvatarColor(provider.name),
                fontSize: 20,
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {getInitials(provider.name)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {provider.name}
              </Typography>
              <Chip
                label={t(`specialty.${provider.specialty}`)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mt: 0.5, fontSize: 11, height: 22 }}
              />
            </Box>
          </Stack>

          {provider.bio && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                WebkitLineClamp: 2,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.55
              }}
            >
              {provider.bio}
            </Typography>
          )}

          <Stack spacing={0.75}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <StarRoundedIcon sx={{ fontSize: 18, color: 'warning.main' }} />
              <Typography variant="body2" fontWeight={600}>
                {provider.rating > 0 ? provider.rating.toFixed(1) : t('card.noRating')}
              </Typography>
            </Stack>
            <Tooltip title={provider.languages} placement="bottom-start">
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                <LanguageIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {provider.languages}
                </Typography>
              </Stack>
            </Tooltip>
          </Stack>

          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography variant="h6" color="primary.main" fontWeight={700}>
              {provider.consultationFee > 0
                ? `$${provider.consultationFee.toFixed(2)}`
                : t('card.free')}
            </Typography>
            {provider.consultationFee > 0 && (
              <Typography variant="caption" color="text.secondary">
                {t('card.perSession')}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>

      <Box sx={{ px: 2.5, pb: 2.5 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<CalendarMonthIcon />}
          onClick={() => onBook(provider)}
          sx={{ borderRadius: 2 }}
        >
          {t('card.book')}
        </Button>
      </Box>
    </Card>
  );
};

export default ProviderCard;
