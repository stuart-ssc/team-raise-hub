// State name to abbreviation mappings
export const stateAbbreviations: Record<string, string> = {
  'alabama': 'AL',
  'alaska': 'AK',
  'arizona': 'AZ',
  'arkansas': 'AR',
  'california': 'CA',
  'colorado': 'CO',
  'connecticut': 'CT',
  'delaware': 'DE',
  'district-of-columbia': 'DC',
  'florida': 'FL',
  'georgia': 'GA',
  'hawaii': 'HI',
  'idaho': 'ID',
  'illinois': 'IL',
  'indiana': 'IN',
  'iowa': 'IA',
  'kansas': 'KS',
  'kentucky': 'KY',
  'louisiana': 'LA',
  'maine': 'ME',
  'maryland': 'MD',
  'massachusetts': 'MA',
  'michigan': 'MI',
  'minnesota': 'MN',
  'mississippi': 'MS',
  'missouri': 'MO',
  'montana': 'MT',
  'nebraska': 'NE',
  'nevada': 'NV',
  'new-hampshire': 'NH',
  'new-jersey': 'NJ',
  'new-mexico': 'NM',
  'new-york': 'NY',
  'north-carolina': 'NC',
  'north-dakota': 'ND',
  'ohio': 'OH',
  'oklahoma': 'OK',
  'oregon': 'OR',
  'pennsylvania': 'PA',
  'rhode-island': 'RI',
  'south-carolina': 'SC',
  'south-dakota': 'SD',
  'tennessee': 'TN',
  'texas': 'TX',
  'utah': 'UT',
  'vermont': 'VT',
  'virginia': 'VA',
  'washington': 'WA',
  'west-virginia': 'WV',
  'wisconsin': 'WI',
  'wyoming': 'WY',
};

// Abbreviation to full state name mappings
export const stateNames: Record<string, string> = {
  'AL': 'Alabama',
  'AK': 'Alaska',
  'AZ': 'Arizona',
  'AR': 'Arkansas',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DE': 'Delaware',
  'DC': 'District of Columbia',
  'FL': 'Florida',
  'GA': 'Georgia',
  'HI': 'Hawaii',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'IA': 'Iowa',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'ME': 'Maine',
  'MD': 'Maryland',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MS': 'Mississippi',
  'MO': 'Missouri',
  'MT': 'Montana',
  'NE': 'Nebraska',
  'NV': 'Nevada',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NY': 'New York',
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'RI': 'Rhode Island',
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VT': 'Vermont',
  'VA': 'Virginia',
  'WA': 'Washington',
  'WV': 'West Virginia',
  'WI': 'Wisconsin',
  'WY': 'Wyoming',
};

// Get all states as an array for iteration
export const allStates = Object.entries(stateNames).map(([abbr, name]) => ({
  abbreviation: abbr,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
}));

// Convert URL slug to state info (supports both full names like 'kentucky' and abbreviations like 'ky')
export function getStateFromSlug(slug: string): { abbr: string; name: string } | null {
  const normalizedSlug = slug.toLowerCase();
  
  // First, try to match as a full state name slug (e.g., 'kentucky')
  const abbrFromName = stateAbbreviations[normalizedSlug];
  if (abbrFromName) {
    return { abbr: abbrFromName, name: stateNames[abbrFromName] };
  }
  
  // Second, try to match as a state abbreviation (e.g., 'ky')
  const upperAbbr = slug.toUpperCase();
  const nameFromAbbr = stateNames[upperAbbr];
  if (nameFromAbbr) {
    return { abbr: upperAbbr, name: nameFromAbbr };
  }
  
  return null;
}

// Convert abbreviation to URL slug
export function getStateSlug(abbr: string): string {
  const name = stateNames[abbr.toUpperCase()];
  if (!name) return abbr.toLowerCase();
  return name.toLowerCase().replace(/\s+/g, '-');
}

// Get state name from abbreviation
export function getStateName(abbr: string): string {
  return stateNames[abbr.toUpperCase()] || abbr;
}
