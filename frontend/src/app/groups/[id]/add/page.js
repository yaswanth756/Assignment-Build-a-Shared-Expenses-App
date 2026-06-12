'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AddExpensePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const splitOptions = ['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE'];

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await api.get(`/groups/${params.id}`);
        if (res.data.success) {
          setGroup(res.data.data.group);
          if (user) {
            setPaidById(user.id);
          }
        }
      } catch (err) {
        setError('Failed to load group data');
      }
    };
    if (params.id) fetchGroup();
  }, [params.id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || !paidById) {
      setError('Please fill out all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Build participants array from all group members
      const participants = group.members.map(member => ({
        userId: member.user.id,
      }));

      const res = await api.post(`/groups/${params.id}/expenses`, {
        description,
        amount: parseFloat(amount),
        paidBy: paidById,        // Backend expects "paidBy", not "paidById"
        splitType,               // Use the user's selected split type
        participants,            // Backend expects "participants" array, not "splits"
      });

      if (res.data.success) {
        router.push(`/groups/${params.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create expense');
      setLoading(false);
    }
  };

  if (!group && !error) return null;

  return (
    <div className="min-h-screen bg-shiraz-50 flex flex-col relative overflow-hidden">
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6 max-w-4xl mx-auto w-full relative z-10 flex flex-col justify-center">
        
        <div className="mb-8">
          <Link href={`/groups/${params.id}`} className="text-[10px] font-bold tracking-[0.2em] uppercase text-shiraz-600 hover:text-shiraz-900 transition-colors flex items-center gap-2">
            <span>←</span> Back to Group
          </Link>
        </div>

        <section className="bg-white rounded-[5rem] p-12 md:p-20 shadow-deep w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 bg-shiraz-500" />

          <div className="text-center mb-16">
            <h1 className="font-anton text-6xl text-shiraz-950 mb-2">ADD EXPENSE</h1>
            <p className="text-shiraz-600 text-xs tracking-widest uppercase font-bold">For {group?.name}</p>
          </div>

          {error && (
             <div className="bg-shiraz-100 text-shiraz-900 px-4 py-3 rounded-card text-xs uppercase tracking-widest font-bold mb-6 text-center">
               {error}
             </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-shiraz-950 mb-4 pl-4">Description</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-shiraz-50 rounded-full px-8 py-5 text-sm font-bold outline-none border-2 border-transparent focus:border-shiraz-300 transition-colors text-shiraz-950 placeholder:text-shiraz-300"
                  placeholder="e.g. Dinner at Dorsia"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-shiraz-950 mb-4 pl-4">Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-shiraz-50 rounded-full px-8 py-5 text-sm font-bold outline-none border-2 border-transparent focus:border-shiraz-300 transition-colors text-shiraz-950 placeholder:text-shiraz-300"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-shiraz-950 mb-4 pl-4">Paid By</label>
                <select 
                  value={paidById}
                  onChange={(e) => setPaidById(e.target.value)}
                  className="w-full bg-shiraz-50 rounded-full px-8 py-5 text-sm font-bold outline-none border-2 border-transparent focus:border-shiraz-300 transition-colors text-shiraz-950 appearance-none"
                  required
                >
                  <option value="" disabled>Select User</option>
                  {group?.members.map(member => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.id === user?.id ? 'You' : member.user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Split Type Selector */}
            <div className="pt-6 border-t border-shiraz-100">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-shiraz-950 mb-6 pl-4 text-center">Split Method</label>
              <div className="flex flex-wrap gap-4 justify-center">
                {splitOptions.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSplitType(type)}
                    className={`px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold border-2 transition-all ${
                      splitType === type 
                        ? 'bg-shiraz-950 text-white border-shiraz-950 shadow-md' 
                        : 'bg-transparent text-shiraz-600 border-shiraz-200 hover:border-shiraz-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-6 mt-4">
              <Link href={`/groups/${params.id}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Expense'}
              </Button>
            </div>

          </form>

        </section>
      </main>
    </div>
  );
}
