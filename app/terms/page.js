import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Terms — ScreenshotOS',
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="TERMS" title="Beta terms for ScreenshotOS." updated="7 October 2026">
      <section>
        <h2>Using the beta</h2>
        <p>
          ScreenshotOS is provided as an early beta service. Features may change, be limited,
          or occasionally be unavailable while the product is being developed and tested.
        </p>
      </section>

      <section>
        <h2>Your account and content</h2>
        <p>
          You are responsible for the screenshots and other content you upload. Do not upload
          content you are not permitted to store or process, or content that is unlawful.
        </p>
      </section>

      <section>
        <h2>AI-generated results</h2>
        <p>
          AI analysis can be incomplete or incorrect. Titles, categories, dates, locations,
          prices, actions, and other generated details should be checked before you rely on
          them. ScreenshotOS is designed as an organisational tool, not as a source of
          professional, legal, medical, financial, or safety-critical advice.
        </p>
      </section>

      <section>
        <h2>Fair use of beta resources</h2>
        <p>
          To keep the beta available to testers, ScreenshotOS may apply reasonable limits to
          uploads, AI analysis, or other resource-intensive features.
        </p>
      </section>

      <section>
        <h2>Availability</h2>
        <p>
          The beta is supplied on an as-available basis. We cannot promise uninterrupted
          availability or that every feature will always operate without error.
        </p>
      </section>

      <section>
        <h2>Ending use</h2>
        <p>
          You can stop using ScreenshotOS at any time and can delete your library or account
          through Settings.
        </p>
      </section>
    </LegalPage>
  );
}
