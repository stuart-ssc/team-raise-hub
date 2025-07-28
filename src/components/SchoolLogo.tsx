

const SchoolLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/lovable-uploads/54b4c57b-1368-44fd-a957-856926bb41dc.png" 
        alt="School Sponsor Connect Logo" 
        className="h-8 w-auto"
      />
    </div>
  );
};

export default SchoolLogo;