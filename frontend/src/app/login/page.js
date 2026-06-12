'use client';
import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-shiraz-50 flex items-center justify-center p-6 relative">
      <div className="absolute top-10 left-10 w-32 h-32 bg-shiraz-200 rounded-[2rem] animate-float opacity-50 blur-sm mix-blend-multiply" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-shiraz-300 rounded-[3rem] animate-float opacity-50 blur-sm mix-blend-multiply" style={{ animationDelay: '2s' }} />

      <Card className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <Link href="/" className="font-anton text-4xl uppercase tracking-wider text-shiraz-950 inline-block mb-2">
            -SplitBuddy
          </Link>
          <p className="text-shiraz-800 text-xs tracking-widest uppercase font-bold">Welcome Back</p>
        </div>

        {error && (
          <div className="bg-shiraz-100 text-shiraz-900 px-4 py-3 rounded-card text-xs uppercase tracking-widest font-bold mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-shiraz-950 mb-2 pl-4">
              Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-shiraz-50 rounded-full px-6 py-4 text-sm outline-none border border-transparent focus:border-shiraz-300 transition-colors text-shiraz-950 placeholder:text-shiraz-300"
              placeholder="hello@example.com"
            />
          </div>
          
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-shiraz-950 mb-2 pl-4">
              Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-shiraz-50 rounded-full px-6 py-4 text-sm outline-none border border-transparent focus:border-shiraz-300 transition-colors text-shiraz-950 placeholder:text-shiraz-300"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" variant="primary" className="mt-4 w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-shiraz-100 pt-6">
          <p className="text-[10px] uppercase tracking-[0.1em] font-bold text-shiraz-800">
            Don't have an account?{' '}
            <Link href="/register" className="text-shiraz-600 hover:text-shiraz-950 transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
