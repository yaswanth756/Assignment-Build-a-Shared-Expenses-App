'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [groups, setGroups] = useState([]);
  const [balances, setBalances] = useState({ totalOwed: 0, totalOwing: 0, netBalance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        const [groupsRes, balancesRes] = await Promise.all([
          api.get('/groups'),
          api.get('/balances')
        ]);
        
        if (groupsRes.data.success) {
          setGroups(groupsRes.data.data.groups);
        }
        
        if (balancesRes.data.success) {
          setBalances(balancesRes.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-shiraz-50 flex items-center justify-center">
        <p className="font-anton text-4xl text-shiraz-950 animate-pulse">LOADING...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-shiraz-50 flex flex-col relative overflow-hidden">
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6 max-w-6xl mx-auto w-full relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h1 className="font-anton text-[8vw] md:text-7xl leading-none tracking-tight text-shiraz-950 mb-2">DASHBOARD</h1>
            <p className="text-shiraz-800 text-xs tracking-widest uppercase font-bold">Welcome back, {user?.name}</p>
          </div>
          <div className="flex gap-4">
            <Link href="/groups/new">
              <Button variant="outline">New Group</Button>
            </Link>
          </div>
        </div>

        {/* Balances Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card hoverEffect className="bg-shiraz-950 text-white border border-shiraz-800">
            <p className="text-[10px] uppercase tracking-widest font-bold text-shiraz-300 mb-4">Net Balance</p>
            <p className={`font-anton text-5xl ${Number(balances.netBalance) >= 0 ? 'text-forest' : 'text-shiraz-500'}`}>
              {Number(balances.netBalance) >= 0 ? '+' : '-'}${Math.abs(Number(balances.netBalance)).toFixed(2)}
            </p>
            <p className="text-xs text-shiraz-400 mt-2 font-medium">Your overall standing</p>
          </Card>
          
          <Card hoverEffect className="bg-white">
            <p className="text-[10px] uppercase tracking-widest font-bold text-shiraz-600 mb-4">You Owe</p>
            <p className="font-anton text-5xl text-shiraz-950">${Number(balances.totalOwing).toFixed(2)}</p>
            <p className="text-xs text-shiraz-400 mt-2 font-medium">Total debt to others</p>
          </Card>

          <Card hoverEffect className="bg-white">
            <p className="text-[10px] uppercase tracking-widest font-bold text-shiraz-600 mb-4">You are Owed</p>
            <p className="font-anton text-5xl text-shiraz-950">${Number(balances.totalOwed).toFixed(2)}</p>
            <p className="text-xs text-shiraz-400 mt-2 font-medium">Total credit from others</p>
          </Card>
        </section>

        {/* Groups List */}
        <section>
          <h2 className="font-anton text-4xl text-shiraz-950 mb-8">YOUR GROUPS</h2>
          
          {groups.length === 0 ? (
            <Card className="text-center py-20 bg-shiraz-100 border-dashed border-2 border-shiraz-300">
              <h3 className="font-anton text-3xl text-shiraz-950 mb-4">NO GROUPS YET</h3>
              <p className="text-sm font-medium text-shiraz-800 mb-8 max-w-md mx-auto">
                You haven't joined any groups. Create a new group to start splitting expenses elegantly.
              </p>
              <Link href="/groups/new">
                <Button variant="primary">Create First Group</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {groups.map((group) => (
                <Link key={group.id} href={`/groups/${group.id}`} className="block group">
                  <Card hoverEffect className="h-full flex flex-col justify-between p-8 border border-transparent group-hover:border-shiraz-200">
                    <div className="flex justify-between items-start mb-12">
                      <div>
                        <h3 className="font-anton text-3xl text-shiraz-950 mb-2">{group.name}</h3>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-shiraz-600">Active Group</p>
                      </div>
                      <div className="bg-shiraz-100 text-shiraz-900 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {new Date(group.createdAt).getFullYear()}
                      </div>
                    </div>
                    
                    <div className="flex items-end justify-between border-t border-shiraz-100 pt-6">
                      <Button variant="blurReveal" className="px-6 py-2 text-[10px] border border-shiraz-200 w-full text-center">
                        View Details
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>
      
      <Footer />
    </div>
  );
}
