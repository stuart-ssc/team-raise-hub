import { Link } from 'react-router-dom';
import { allStates } from '@/lib/stateUtils';
import { MapPin } from 'lucide-react';

export const StateBrowser = () => {
  // Group states by first letter for better navigation
  const statesByLetter = allStates.reduce((acc, state) => {
    const letter = state.name[0];
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(state);
    return acc;
  }, {} as Record<string, typeof allStates>);

  const letters = Object.keys(statesByLetter).sort();

  return (
    <div className="space-y-8">
      {letters.map((letter) => (
        <div key={letter}>
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {letter}
            </span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {statesByLetter[letter].map((state) => (
              <Link
                key={state.abbreviation}
                to={`/schools/${state.slug}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-foreground hover:text-primary"
              >
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{state.name}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
