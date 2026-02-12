'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password || undefined,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          role: 'student',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      if (password) {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
          credentials: 'include',
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.token) {
          localStorage.setItem('lms_token', loginData.token);
          router.push('/dashboard');
          return;
        }
      }
      router.push('/login');
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Create account</h1>
        <p className="text-gray-500 text-center mt-1 text-sm">CVERSE Academy</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 pr-14 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Optional; you can set it later.</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
