

const SchoolLogo = ({ theme = 'dark', className = "" }: { 
  theme?: 'light' | 'dark';
  className?: string 
}) => {
  const logoSrc = theme === 'light' 
    ? '/lovable-uploads/Sponsorly-Logo.jpg' 
    : '/lovable-uploads/Sponsorly-Logo-White.png';
    
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoSrc} 
        alt="Sponsorly Logo" 
        className="h-10 w-auto"
      />
    </div>
  );
};

export default SchoolLogo;