export const metadata = {
  title: 'Login — NextLevel',
  description: 'Sign in or create an account to start practicing',
};

export default function AuthLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {children}
    </div>
  );
}
