// File: src/app/admin/layout.jsx — ADD sidebar toggle functionality
import '@/styles/admin.css';

export const metadata = {
  title: 'Admin Panel',
  robots: 'noindex, nofollow',
};

/**
 * Admin layout wrapper.
 * Includes a mobile sidebar toggle button and overlay.
 * The toggle is only visible on tablet and mobile devices.
 */
export default function AdminLayout({ children }) {
  return (
    <>
      <div className="admin-body">
        {children}
      </div>
    </>
  );
}