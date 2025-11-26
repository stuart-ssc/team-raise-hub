const SponsorlyLogo = ({ variant = 'full', theme = 'dark', className = "" }: { 
  variant?: 'full' | 'mark'; 
  theme?: 'light' | 'dark';
  className?: string 
}) => {
  const logoSrc = variant === 'full' 
    ? (theme === 'light' ? '/lovable-uploads/Sponsorly-Logo.png' : '/lovable-uploads/Sponsorly-Logo-White.png')
    : (theme === 'light' ? '/lovable-uploads/Sponsorly-Mark.jpg' : '/lovable-uploads/Sponsorly-Mark-White.png');
  
  // Default sizes if no className provided
  const defaultSize = variant === 'full' ? 'h-12 w-auto' : 'h-8 w-8';
  // If className provided, use it; otherwise use default
  const imgClassName = className || defaultSize;
    
  return (
    <div className="flex items-center">
      <img 
        src={logoSrc} 
        alt="Sponsorly" 
        className={imgClassName}
      />
    </div>
  );
};

export default SponsorlyLogo;
