import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="pb-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl prose prose-lg">
            <h2>Acceptance of Terms</h2>
            <p>
              [Placeholder: This section will explain that by using Sponsorly, users agree to be bound by these terms of service.]
            </p>

            <h2>Use of Services</h2>
            <p>
              [Placeholder: This section will describe permitted and prohibited uses of the platform.]
            </p>

            <h2>User Accounts</h2>
            <p>
              [Placeholder: This section will outline requirements and responsibilities for user accounts.]
            </p>

            <h2>Payment Terms</h2>
            <p>
              [Placeholder: This section will explain payment processing, fees, and refund policies.]
            </p>

            <h2>Intellectual Property</h2>
            <p>
              [Placeholder: This section will describe ownership of content and intellectual property rights.]
            </p>

            <h2>User Content</h2>
            <p>
              [Placeholder: This section will explain user responsibilities for content they upload or create.]
            </p>

            <h2>Disclaimers</h2>
            <p>
              [Placeholder: This section will include necessary legal disclaimers about service availability and warranties.]
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              [Placeholder: This section will limit Sponsorly's liability for damages arising from use of the service.]
            </p>

            <h2>Termination</h2>
            <p>
              [Placeholder: This section will explain conditions under which accounts may be terminated.]
            </p>

            <h2>Changes to Terms</h2>
            <p>
              [Placeholder: This section will explain how users will be notified of changes to these terms.]
            </p>

            <h2>Contact Information</h2>
            <p>
              [Placeholder: Contact information for questions about these terms will be provided here.]
            </p>
          </div>
        </section>
      </main>
      
      <MarketingFooter />
    </div>
  );
};

export default Terms;
