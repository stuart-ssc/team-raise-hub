import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="pb-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl prose prose-lg">
            <h2>Information We Collect</h2>
            <p>
              [Placeholder: This section will describe what information we collect from users, including personal information, usage data, and cookies.]
            </p>

            <h2>How We Use Your Information</h2>
            <p>
              [Placeholder: This section will explain how we use the collected information to provide and improve our services.]
            </p>

            <h2>Information Sharing</h2>
            <p>
              [Placeholder: This section will detail under what circumstances we share information with third parties.]
            </p>

            <h2>Data Security</h2>
            <p>
              [Placeholder: This section will describe the security measures we take to protect user data.]
            </p>

            <h2>Your Rights</h2>
            <p>
              [Placeholder: This section will outline user rights regarding their personal data, including access, correction, and deletion.]
            </p>

            <h2>Cookies</h2>
            <p>
              [Placeholder: This section will explain our use of cookies and similar tracking technologies.]
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              [Placeholder: This section will explain how we notify users of changes to our privacy policy.]
            </p>

            <h2>Contact Us</h2>
            <p>
              [Placeholder: Contact information for privacy-related inquiries will be provided here.]
            </p>
          </div>
        </section>
      </main>
      
      <MarketingFooter />
    </div>
  );
};

export default PrivacyPolicy;
