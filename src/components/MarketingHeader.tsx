import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SponsorlyLogo from '@/components/SponsorlyLogo';

const MarketingHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformMenuOpen, setPlatformMenuOpen] = useState(false);

  const navigation = [
    { name: 'Schools', href: '/schools' },
    { name: 'Nonprofits', href: '/nonprofits' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
  ];

  const platformItems = [
    { name: 'Campaigns', href: '/campaigns-overview' },
    { name: 'Roster Enabled Campaigns', href: '/campaigns/roster' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <SponsorlyLogo variant="full" theme="light" className="h-16" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {navigation.slice(0, 2).map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
            
            {/* Platform with Hover Dropdown */}
            <div 
              className="relative flex items-center"
              onMouseEnter={() => setPlatformMenuOpen(true)}
              onMouseLeave={() => setPlatformMenuOpen(false)}
            >
              <Link
                to="/platform"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                Platform
                <ChevronDown className="h-4 w-4" />
              </Link>
              
              {platformMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
                  <div className="bg-popover border rounded-md shadow-md p-1 min-w-[200px]">
                    {platformItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="block px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {navigation.slice(2).map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}

            <Link
              to="/for-businesses"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              For Businesses
            </Link>
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex">
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col gap-4">
              {navigation.slice(0, 2).map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Platform Links */}
              <div className="border-t pt-4 mt-2">
                <Link
                  to="/platform"
                  className="text-base font-medium text-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Platform
                </Link>
                {platformItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="block py-2 pl-4 text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {navigation.slice(2).map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors border-t pt-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <Link
                to="/for-businesses"
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors border-t pt-4"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Businesses
              </Link>

              <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default MarketingHeader;
