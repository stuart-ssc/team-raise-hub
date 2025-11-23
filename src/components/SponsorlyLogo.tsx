const SponsorlyLogo = ({ variant = 'full', theme = 'dark', className = "" }: { 
  variant?: 'full' | 'mark'; 
  theme?: 'light' | 'dark';
  className?: string 
}) => {
  const logoSrc = variant === 'full' 
    ? (theme === 'light' ? '/lovable-uploads/Sponsorly-Logo.jpg' : '/lovable-uploads/Sponsorly-Logo-White.png')
    : (theme === 'light' ? '/lovable-uploads/Sponsorly-Mark.jpg' : '/lovable-uploads/Sponsorly-Mark-White.png');
    
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoSrc} 
        alt="Sponsorly" 
        className={variant === 'full' ? 'h-12 w-auto' : 'h-8 w-8'}
      />
    </div>
  );
};

export default SponsorlyLogo;
