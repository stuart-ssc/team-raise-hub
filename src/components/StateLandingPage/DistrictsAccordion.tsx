import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { School, Building2, ChevronRight, ExternalLink } from 'lucide-react';

interface DistrictsAccordionProps {
  stateAbbr: string;
  stateSlug: string;
}

const DISTRICTS_PER_PAGE = 50;

export const DistrictsAccordion = ({ stateAbbr, stateSlug }: DistrictsAccordionProps) => {
  const [visibleCount, setVisibleCount] = useState(DISTRICTS_PER_PAGE);

  // Fetch districts for this state
  const { data: districts, isLoading: districtsLoading } = useQuery({
    queryKey: ['state-districts', stateAbbr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_districts')
        .select('id, name, slug')
        .eq('state', stateAbbr)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch schools grouped by district
  const { data: schoolsByDistrict, isLoading: schoolsLoading } = useQuery({
    queryKey: ['state-schools-by-district', stateAbbr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, school_name, slug, school_district_id, city')
        .eq('state', stateAbbr)
        .order('school_name');

      if (error) throw error;

      // Group schools by district
      const grouped: Record<string, typeof data> = {};
      for (const school of data || []) {
        const districtId = school.school_district_id || 'independent';
        if (!grouped[districtId]) {
          grouped[districtId] = [];
        }
        grouped[districtId].push(school);
      }
      return grouped;
    },
    enabled: !!districts && districts.length > 0,
  });

  // Fetch published configs to show badges
  const { data: publishedConfigs } = useQuery({
    queryKey: ['state-published-configs', stateAbbr],
    queryFn: async () => {
      const { data: schools } = await supabase
        .from('schools')
        .select('id')
        .eq('state', stateAbbr);

      if (!schools || schools.length === 0) return new Set<string>();

      const { data: configs } = await supabase
        .from('landing_page_configs')
        .select('entity_id')
        .eq('entity_type', 'school')
        .eq('is_published', true)
        .in('entity_id', schools.map(s => s.id));

      return new Set((configs || []).map(c => c.entity_id));
    },
  });

  if (districtsLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!districts || districts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No districts found in this state.
      </div>
    );
  }

  const visibleDistricts = districts.slice(0, visibleCount);
  const hasMore = districts.length > visibleCount;

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="space-y-2">
        {visibleDistricts.map((district) => {
          const districtSchools = schoolsByDistrict?.[district.id] || [];
          const schoolCount = districtSchools.length;

          return (
            <AccordionItem
              key={district.id}
              value={district.id}
              className="border rounded-lg px-4 bg-background/50"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{district.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {schoolCount} {schoolCount === 1 ? 'school' : 'schools'}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {schoolsLoading ? (
                  <div className="space-y-2 pl-11">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : districtSchools.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-11">
                    No schools listed in this district.
                  </p>
                ) : (
                  <ul className="space-y-1 pl-11">
                    {districtSchools.map((school) => (
                      <li key={school.id}>
                        <Link
                          to={`/schools/${stateSlug}/${school.slug}`}
                          className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent/50 transition-colors group"
                        >
                          <School className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 text-foreground group-hover:text-primary transition-colors">
                            {school.school_name}
                          </span>
                          {school.city && (
                            <span className="text-sm text-muted-foreground">
                              {school.city}
                            </span>
                          )}
                          {publishedConfigs?.has(school.id) && (
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {district.slug && (
                  <div className="mt-4 pl-11">
                    <Link
                      to={`/districts/${stateSlug}/${district.slug}`}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      View {district.name} page
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => prev + DISTRICTS_PER_PAGE)}
          >
            Load More Districts ({districts.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
};
