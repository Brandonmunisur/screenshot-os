import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Privacy — ScreenshotOS',
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="PRIVACY" title="Your screenshots stay your data." updated="7 October 2026">
      <section>
        <h2>What ScreenshotOS stores</h2>
        <p>
          ScreenshotOS stores the screenshots you upload, the AI analysis created from them,
          saved-list information, account metadata, and limited product-usage events needed
          to operate and improve the beta.
        </p>
      </section>

      <section>
        <h2>How screenshots are processed</h2>
        <p>
          Uploaded screenshots are stored in your private account-scoped library. When AI
          analysis is enabled, the image is sent from the ScreenshotOS server to the configured
          AI provider so it can identify useful details such as category, title, intent,
          location, event information, and suggested actions.
        </p>
      </section>

      <section>
        <h2>Access and sharing</h2>
        <p>
          Screenshot libraries are account-scoped. ScreenshotOS does not make your uploaded
          images public. We do not sell your screenshot history or use it to create an
          advertising profile.
        </p>
      </section>

      <section>
        <h2>Beta analytics</h2>
        <p>
          During the beta, ScreenshotOS may record basic first-party usage events such as an
          upload, completed analysis, search, or smart-action use. These events are used to
          understand whether the product works and which workflows are useful.
        </p>
      </section>

      <section>
        <h2>Your controls</h2>
        <p>
          You can delete individual screenshots, delete your full library, disable automatic
          AI analysis, or permanently delete your ScreenshotOS account from Settings.
        </p>
      </section>

      <section>
        <h2>Beta status</h2>
        <p>
          ScreenshotOS is currently an early beta product. Data-handling practices may be
          refined as the product develops. Material changes will be reflected on this page.
        </p>
      </section>
    </LegalPage>
  );
}
