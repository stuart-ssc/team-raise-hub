

import SponsorlyLogo from "./SponsorlyLogo";

const SchoolLogo = ({ theme = 'dark', className = "" }: { 
  theme?: 'light' | 'dark';
  className?: string 
}) => {
  return <SponsorlyLogo variant="full" theme={theme} className={className} />;
};

export default SchoolLogo;