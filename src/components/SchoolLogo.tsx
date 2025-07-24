import { Shield } from "lucide-react";

const SchoolLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-primary text-primary-foreground p-2 rounded-lg">
        <Shield className="h-6 w-6" />
      </div>
      <div>
        <div className="font-bold text-lg leading-tight">SCHOOL SPONSOR</div>
        <div className="font-bold text-lg leading-tight">CONNECT</div>
      </div>
    </div>
  );
};

export default SchoolLogo;