'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/groups', { name, description });
      if (res.data.success) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-shiraz-50 flex flex-col relative overflow-hidden">
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6 max-w-4xl mx-auto w-full relative z-10 flex flex-col justify-center">
        
        <div className="mb-8">
          <Link href={`/dashboard`} className="text-[10px] font-bold tracking-[0.2em] uppercase text-shiraz-600 hover:text-shiraz-900 transition-colors flex items-center gap-2">
            <span>←</span> Back to Dashboard
          </Link>
        </div>

        <section className="bg-white rounded-[5rem] p-12 md:p-20 shadow-deep w-full relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-4 bg-shiraz-500" />

          <div className="text-center mb-16">
            <h1 className="font-anton text-6xl text-shiraz-950 mb-2">CREATE GROUP</h1>
            <p className="text-shiraz-600 text-xs tracking-widest uppercase font-bold">Start Splitting Elegantly</p>
          </div>

          {error && (
            <div className="bg-shiraz-100 text-shiraz-900 px-4 py-3 rounded-card text-xs uppercase tracking-widest font-bold mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Group Name */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-shiraz-950 mb-4 pl-4">
                  Group Name
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-shiraz-50 rounded-full px-8 py-5 text-sm font-bold outline-none border-2 border-transparent focus:border-shiraz-300 transition-colors text-shiraz-950 placeholder:text-shiraz-300"
                  placeholder="e.g. Apartment 4B"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-shiraz-950 mb-4 pl-4">
                  Description
                </label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-shiraz-50 rounded-full px-8 py-5 text-sm font-bold outline-none border-2 border-transparent focus:border-shiraz-300 transition-colors text-shiraz-950 placeholder:text-shiraz-300"
                  placeholder="e.g. Home expenses"
                />
              </div>
            </div>

            <div className="flex justify-end gap-6 mt-4">
              <Link href={`/dashboard`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
            </div>

          </form>

        </section>
      </main>
    </div>
  );
}
