import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { School, Building2, Users, MapPin } from 'lucide-react';

interface StateStatsProps {
  stateAbbr: string;
  stateName: string;
}

export const StateStats = ({ stateAbbr, stateName }: StateStatsProps) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['state-stats', stateAbbr],
    queryFn: async () => {
      // Get school count
      const { count: schoolCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true })
        .eq('state', stateAbbr);

      // Get district count
      const { count: districtCount } = await supabase
        .from('school_districts')
        .select('*', { count: 'exact', head: true })
        .eq('state', stateAbbr);

      // Get published landing pages count
      const { data: schoolsWithConfigs } = await supabase
        .from('schools')
        .select('id')
        .eq('state', stateAbbr);

      let publishedCount = 0;
      if (schoolsWithConfigs && schoolsWithConfigs.length > 0) {
        const { count } = await supabase
          .from('landing_page_configs')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', 'school')
          .eq('is_published', true)
          .in('entity_id', schoolsWithConfigs.map(s => s.id));
        publishedCount = count || 0;
      }

      return {
        schools: schoolCount || 0,
        districts: districtCount || 0,
        publishedPages: publishedCount,
      };
    },
  });

  const showActiveCount = stats?.publishedPages && stats.publishedPages >= 10;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      icon: School,
      value: stats?.schools.toLocaleString() || '0',
      label: 'Schools',
    },
    {
      icon: Building2,
      value: stats?.districts.toLocaleString() || '0',
      label: 'Districts',
    },
    ...(showActiveCount ? [{
      icon: Users,
      value: stats.publishedPages.toLocaleString(),
      label: 'Active on Sponsorly',
    }] : []),
    {
      icon: MapPin,
      value: stateName,
      label: 'State',
    },
  ];

  const gridCols = statItems.length === 4 
    ? 'grid-cols-2 md:grid-cols-4' 
    : 'grid-cols-1 sm:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {statItems.map((item, index) => (
        <Card key={index} className="bg-background/80 backdrop-blur-sm border-primary/20">
          <CardContent className="pt-6 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{item.value}</p>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
