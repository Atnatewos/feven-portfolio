// File: src/app/(public)/contact/page.jsx
import ContactForm from '@/components/sections/ContactForm';
import SocialContact from '@/components/sections/SocialContact';
import { getSiteSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';

/**
 * Generates dynamic metadata for the Contact page.
 * Reads page title and subtitle from the database.
 */
export async function generateMetadata() {
  const settings = await getSiteSettings();
  const branding = settings?.branding || {};
  const contact = settings?.contact || {};

  return {
    title: `${contact.pageTitle?.en || 'Get In Touch'} - ${branding.siteName || 'Portfolio'}`,
    description: contact.subtitle?.en || `Contact ${branding.siteName || 'me'} for collaborations.`,
  };
}

/**
 * Contact page — THE MOST IMPORTANT PAGE on the site.
 *
 * Layout order (top to bottom):
 * 1. Page header: title "Get In Touch" + subtitle
 * 2. Social contact grid: phone cards, social media cards
 * 3. Email display: inline centered above the form
 * 4. Contact form: name, email, message fields with submit button
 *
 * All content comes from the database via getSiteSettings().
 * Only platforms configured in the admin panel appear.
 */
export default async function ContactPage() {
  const settings = await getSiteSettings();
  const contact = settings?.contact || {};
  const social = settings?.social || {};

  return (
    <section className="contact-page">
      <div className="container container-narrow">
        <div className="contact-header">
          <h1 className="contact-title">
            {contact.pageTitle?.en || 'Get In Touch'}
          </h1>
          {contact.subtitle?.en && (
            <p className="contact-subtitle">{contact.subtitle.en}</p>
          )}
        </div>

        <SocialContact links={social} settings={settings} />

        <ContactForm />
      </div>
    </section>
  );
}