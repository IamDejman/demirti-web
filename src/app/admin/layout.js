import AdminLayoutShell from '../components/AdminLayoutShell';

export const metadata = {
  title: {
    default: 'Applications',
    template: '%s | Admin',
  },
};

export default function AdminLayout({ children }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
