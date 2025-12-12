import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface DistrictsAccordionProps {
  stateAbbr: string;
  stateSlug: string;
}

const DISTRICTS_PER_PAGE = 100;

export const DistrictsAccordion = ({ stateAbbr, stateSlug }: DistrictsAccordionProps) => {
  const [visibleCount, setVisibleCount] = useState(DISTRICTS_PER_PAGE);

  const { data: districts, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleDistricts.map((district) => (
          <Link
            key={district.id}
            to={`/districts/${stateSlug}/${district.slug}`}
            className="px-4 py-3 rounded-lg border border-border bg-background hover:bg-primary hover:border-primary transition-colors group"
          >
            <p className="text-sm font-medium text-foreground group-hover:text-white transition-colors line-clamp-2">
              {district.name}
            </p>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="text-center">
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
