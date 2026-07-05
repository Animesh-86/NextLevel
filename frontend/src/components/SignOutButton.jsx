'use client';
import { signOut } from '@/lib/useAuth';

export default function SignOutButton({ className, style, children }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className={className}
      style={{ cursor: 'pointer', ...style }}
    >
      {children || 'Sign Out'}
    </button>
  );
}
