const SponsorlyLogo = ({ variant = 'full', className = "" }: { 
  variant?: 'full' | 'mark'; 
  className?: string 
}) => {
  const logoSrc = variant === 'full' 
    ? '/lovable-uploads/Sponsorly-Logo-White.png'
    : '/lovable-uploads/Sponsorly-Mark-White.png';
    
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
