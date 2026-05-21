// File: src/app/(public)/layout.jsx
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

/**
 * Public layout — wraps all public-facing pages with Header and Footer.
 *
 * ARCHITECTURE RULE:
 * This layout does NOT render <html> or <body>.
 * The root layout (src/app/layout.jsx) handles those.
 * This layout only provides the public chrome: Header + main + Footer.
 *
 * Admin pages live OUTSIDE this route group at src/app/admin/
 * and have their own layout with the admin sidebar.
 */
export default function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}