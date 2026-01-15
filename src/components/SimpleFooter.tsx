import { Link } from 'react-router-dom';

const SimpleFooter = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sponsorly™. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link 
              to="/terms" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link 
              to="/privacy" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link 
              to="/dpa" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Data Processing Agreement
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SimpleFooter;
