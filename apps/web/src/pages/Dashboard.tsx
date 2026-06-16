import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import { Dns as DnsIcon, Article as ArticleIcon } from '@mui/icons-material';
import { api } from '../api/client';

export default function Dashboard() {
  const serversQuery = useQuery({
    queryKey: ['servers'],
    queryFn: () => api.getServers(),
  });

  const sitesQuery = useQuery({
    queryKey: ['sites'],
    queryFn: () => api.getSites(),
  });

  const servers = serversQuery.data || [];
  const sites = sitesQuery.data || [];
  const onlineServers = servers.filter(s => s.status === 'online').length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DnsIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{servers.length}</Typography>
                  <Typography color="text.secondary">Total Servers</Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {onlineServers} online
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ArticleIcon color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{sites.length}</Typography>
                  <Typography color="text.secondary">Total Sites</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DnsIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{servers.length - onlineServers}</Typography>
                  <Typography color="text.secondary">Offline Servers</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
