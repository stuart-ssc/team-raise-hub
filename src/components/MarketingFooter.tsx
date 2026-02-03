import { Link } from 'react-router-dom';
import SponsorlyLogo from '@/components/SponsorlyLogo';

const MarketingFooter = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="space-y-4">
            <SponsorlyLogo variant="full" theme="light" />
            <p className="text-sm text-muted-foreground">
              Empowering schools and non-profits to raise funds effortlessly.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/for-businesses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  For Businesses
                </Link>
              </li>
              <li>
                <Link to="/donor-receipts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Tax Receipts
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Campaigns</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/campaigns-overview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link to="/campaigns/sponsorships" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sponsorships
                </Link>
              </li>
              <li>
                <Link to="/campaigns/donations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Donations
                </Link>
              </li>
              <li>
                <Link to="/campaigns/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/campaigns/merchandise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Merchandise
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About
                </a>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="bg-primary text-primary-foreground rounded-lg p-6">
            <h3 className="font-semibold mb-3">Get Started</h3>
            <p className="text-sm text-primary-foreground/80 mb-4">
              Ready to transform your fundraising?
            </p>
            <Link 
              to="/signup" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white text-primary hover:bg-white/90 h-10 px-4 py-2"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sponsorly™. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/dpa" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Data Processing Agreement
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
