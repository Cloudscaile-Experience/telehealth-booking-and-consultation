import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LanguageIcon from '@mui/icons-material/Language';
import StarIcon from '@mui/icons-material/Star';
import { Avatar, Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { Provider } from '@/types/telehealth';

interface ProviderCardProps {
  ns: string;
  provider: Provider;
  onBook: (provider: Provider) => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ ns, provider, onBook }) => {
  const { t } = useTranslation(ns);

  const initials = provider.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar src={provider.avatarUrl ?? undefined} sx={{ width: 56, height: 56 }}>
              {initials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {provider.name}
              </Typography>
              <Chip
                label={t(`specialty.${provider.specialty}`)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Stack>

          {provider.bio && (
            <Typography variant="body2" color="text.secondary" sx={{ WebkitLineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
              {provider.bio}
            </Typography>
          )}

          <Stack spacing={0.5}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <StarIcon fontSize="small" sx={{ color: 'warning.main' }} />
              <Typography variant="body2">
                {provider.rating > 0 ? provider.rating.toFixed(1) : t('card.noRating')}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <LanguageIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary" noWrap>
                {provider.languages}
              </Typography>
            </Stack>
          </Stack>

          <Typography variant="h6" color="primary.main">
            {provider.consultationFee > 0
              ? `$${provider.consultationFee.toFixed(2)}`
              : t('card.free')}
          </Typography>
        </Stack>
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<CalendarMonthIcon />}
          onClick={() => onBook(provider)}
        >
          {t('card.book')}
        </Button>
      </Box>
    </Card>
  );
};

export default ProviderCard;
