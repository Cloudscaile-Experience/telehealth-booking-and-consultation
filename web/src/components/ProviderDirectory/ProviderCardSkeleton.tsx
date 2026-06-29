import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material';

const ProviderCardSkeleton: React.FC = () => (
  <Card
    variant="outlined"
    sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3 }}
  >
    <CardContent sx={{ flex: 1, p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Skeleton variant="circular" width={64} height={64} sx={{ flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={22} />
            <Skeleton
              variant="rounded"
              width={110}
              height={22}
              sx={{ mt: 0.75, borderRadius: 10 }}
            />
          </Box>
        </Stack>

        <Box>
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="80%" />
        </Box>

        <Stack spacing={0.75}>
          <Skeleton variant="text" width={80} height={18} />
          <Skeleton variant="text" width={130} height={16} />
        </Stack>

        <Skeleton variant="text" width={70} height={32} />
      </Stack>
    </CardContent>

    <Box sx={{ px: 2.5, pb: 2.5 }}>
      <Skeleton variant="rounded" height={40} sx={{ borderRadius: 2 }} />
    </Box>
  </Card>
);

export default ProviderCardSkeleton;
