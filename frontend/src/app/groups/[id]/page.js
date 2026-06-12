'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('expenses');

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberMsg, setAddMemberMsg] = useState({ type: '', text: '' });

  // Settle up modal
  const [showSettle, setShowSettle] = useState(false);
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleLoading, setSettleLoading] = useState(false);
  const [settleMsg, setSettleMsg] = useState({ type: '', text: '' });

  const fetchGroupData = async () => {
    try {
      const [groupRes, expensesRes, balancesRes] = await Promise.all([
        api.get(`/groups/${params.id}`),
        api.get(`/groups/${params.id}/expenses`),
        api.get(`/groups/${params.id}/balances`)
      ]);

      if (groupRes.data.success) setGroup(groupRes.data.data.group);
      if (expensesRes.data.success) setExpenses(expensesRes.data.data.expenses);
      if (balancesRes.data.success) {
        const { balances: balancesData, memberDetails, debts: debtsData } = balancesRes.data.data;
        const formattedBalances = Object.entries(balancesData).map(([userId, amt]) => ({
          userId,
          name: memberDetails[userId]?.name || 'Unknown User',
          net_balance: amt
        }));
        setBalances(formattedBalances);
        setDebts(debtsData || []);
      }
      
    } catch (err) {
      console.error('Error fetching group data', err);
      setError(err.response?.data?.message || 'Failed to load group details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchGroupData();
  }, [params.id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setAddMemberLoading(true);
    setAddMemberMsg({ type: '', text: '' });
    try {
      const res = await api.post(`/groups/${params.id}/members`, { email: memberEmail.trim() });
      if (res.data.success) {
        setAddMemberMsg({ type: 'success', text: `${memberEmail} added successfully!` });
        setMemberEmail('');
        fetchGroupData(); // Refresh data
      }
    } catch (err) {
      setAddMemberMsg({ type: 'error', text: err.response?.data?.message || 'Failed to add member.' });
    } finally {
      setAddMemberLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-shiraz-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-shiraz-200 border-t-shiraz-950 rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-shiraz-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-shiraz-50 flex items-center justify-center flex-col gap-6 px-6">
        <div className="bg-white rounded-3xl p-12 shadow-md text-center max-w-md">
          <div className="w-16 h-16 bg-shiraz-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="font-anton text-3xl text-shiraz-950 mb-3">OOPS</h2>
          <p className="text-shiraz-600 text-sm mb-8">{error || 'Group not found'}</p>
          <Link href="/dashboard"><Button variant="primary">Return to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const myBalance = balances.find(b => b.userId === user?.id);
  const myNet = myBalance ? Number(myBalance.net_balance) : 0;

  return (
    <div className="min-h-screen bg-shiraz-50 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 md:pt-32 pb-20 px-4 md:px-6 max-w-6xl mx-auto w-full">
        
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-[10px] font-bold tracking-[0.2em] uppercase text-shiraz-500 hover:text-shiraz-900 transition-colors inline-flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            Dashboard
          </Link>
        </div>

        {/* Group Header Card */}
        <div className="bg-shiraz-950 text-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 mb-8 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-shiraz-800/30" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-shiraz-800/20" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <h1 className="font-anton text-4xl md:text-6xl leading-none tracking-tight mb-3 uppercase break-words">{group.name}</h1>
                {group.description && (
                  <p className="text-shiraz-300 text-sm mb-4">{group.description}</p>
                )}
                
                {/* Member avatars */}
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 5).map((member) => (
                      <div key={member.user.id} className="w-8 h-8 rounded-full bg-shiraz-700 border-2 border-shiraz-950 flex items-center justify-center text-[10px] font-bold uppercase text-white" title={member.user.name}>
                        {member.user.name.charAt(0)}
                      </div>
                    ))}
                    {group.members.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-shiraz-600 border-2 border-shiraz-950 flex items-center justify-center text-[10px] font-bold text-white">
                        +{group.members.length - 5}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-shiraz-400">{group.members.length} Members</span>
                  <button 
                    onClick={() => setShowAddMember(true)}
                    className="w-8 h-8 rounded-full bg-shiraz-800 hover:bg-shiraz-700 border-2 border-dashed border-shiraz-600 flex items-center justify-center text-sm text-shiraz-400 hover:text-white transition-all"
                    title="Add Member"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-4 md:gap-6 shrink-0">
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-widest text-shiraz-400 font-bold mb-1">Total Spent</p>
                  <p className="font-anton text-2xl md:text-3xl">${totalExpenses.toFixed(2)}</p>
                </div>
                <div className="w-px bg-shiraz-700" />
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-widest text-shiraz-400 font-bold mb-1">Your Balance</p>
                  <p className={`font-anton text-2xl md:text-3xl ${myNet >= 0 ? 'text-green-400' : 'text-shiraz-400'}`}>
                    {myNet >= 0 ? '+' : ''}{myNet.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-shiraz-800">
              <Link href={`/groups/${params.id}/add`}>
                <button className="bg-white text-shiraz-950 px-6 py-2.5 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold hover:bg-shiraz-50 transition-colors shadow-md flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  Add Expense
                </button>
              </Link>
              <button 
                onClick={() => { setShowSettle(true); setSettleMsg({ type: '', text: '' }); }}
                className="bg-shiraz-800 text-white px-6 py-2.5 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold hover:bg-shiraz-700 transition-colors border border-shiraz-700 flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Settle Up
              </button>
            </div>
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddMember(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-anton text-2xl text-shiraz-950">ADD MEMBER</h3>
                <button onClick={() => setShowAddMember(false)} className="w-8 h-8 rounded-full bg-shiraz-50 hover:bg-shiraz-100 flex items-center justify-center text-shiraz-600 transition-colors">✕</button>
              </div>
              
              {addMemberMsg.text && (
                <div className={`rounded-2xl px-4 py-3 mb-4 text-xs font-bold uppercase tracking-widest ${
                  addMemberMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-shiraz-50 text-shiraz-700'
                }`}>
                  {addMemberMsg.text}
                </div>
              )}

              <form onSubmit={handleAddMember} className="flex flex-col gap-4">
                <p className="text-sm text-shiraz-600">Enter the email address of a registered SplitBuddy user.</p>
                <input 
                  type="email" 
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="w-full bg-shiraz-50 rounded-full px-6 py-4 text-sm font-medium outline-none border-2 border-transparent focus:border-shiraz-300 transition-colors text-shiraz-950 placeholder:text-shiraz-300"
                  placeholder="friend@example.com"
                  required
                />
                <button 
                  type="submit" 
                  disabled={addMemberLoading}
                  className="bg-shiraz-950 text-white px-6 py-3.5 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold hover:bg-shiraz-800 transition-colors disabled:opacity-50"
                >
                  {addMemberLoading ? 'Adding...' : 'Add to Group'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Settle Up Modal */}
        {showSettle && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSettle(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-anton text-2xl text-shiraz-950">SETTLE UP</h3>
                <button onClick={() => setShowSettle(false)} className="w-8 h-8 rounded-full bg-shiraz-50 hover:bg-shiraz-100 flex items-center justify-center text-shiraz-600 transition-colors">✕</button>
              </div>

              {settleMsg.text && (
                <div className={`rounded-2xl px-4 py-3 mb-4 text-xs font-bold uppercase tracking-widest ${
                  settleMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-shiraz-50 text-shiraz-700'
                }`}>
                  {settleMsg.text}
                </div>
              )}

              {/* Show only YOUR debts as quick-pick */}
              {(() => {
                const myDebts = debts.filter(d => d.from?.id === user?.id);
                if (myDebts.length === 0) return null;
                return (
                  <div className="mb-6">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-shiraz-400 mb-3">You owe — tap to auto-fill</p>
                    <div className="flex flex-col gap-2">
                      {myDebts.map((debt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSettleTo(debt.to?.id);
                            setSettleAmount(debt.amount.toFixed(2));
                          }}
                          className="flex items-center justify-between p-3 rounded-2xl border border-shiraz-200 hover:border-shiraz-400 hover:bg-shiraz-50 cursor-pointer text-left transition-all"
                        >
                          <span className="text-xs font-bold text-shiraz-950">You → {debt.to?.name}</span>
                          <span className="font-anton text-sm text-shiraz-500">${debt.amount.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!settleTo || !settleAmount) {
                  setSettleMsg({ type: 'error', text: 'Select a person and enter the amount.' });
                  return;
                }
                setSettleLoading(true);
                setSettleMsg({ type: '', text: '' });
                try {
                  const res = await api.post(`/groups/${params.id}/settlements`, {
                    paidTo: settleTo,
                    amount: parseFloat(settleAmount),
                  });
                  if (res.data.success) {
                    setSettleMsg({ type: 'success', text: 'Settlement recorded!' });
                    setSettleTo('');
                    setSettleAmount('');
                    fetchGroupData();
                    setTimeout(() => setShowSettle(false), 1200);
                  }
                } catch (err) {
                  setSettleMsg({ type: 'error', text: err.response?.data?.message || 'Failed to settle.' });
                } finally {
                  setSettleLoading(false);
                }
              }} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-shiraz-950 mb-2 pl-3">Paying To</label>
                  <select
                    value={settleTo}
                    onChange={(e) => setSettleTo(e.target.value)}
                    className="w-full bg-shiraz-50 rounded-full px-6 py-4 text-sm font-medium outline-none border-2 border-transparent focus:border-shiraz-300 transition-colors text-shiraz-950 appearance-none"
                    required
                  >
                    <option value="" disabled>Select member</option>
                    {group?.members.filter(m => m.user.id !== user?.id).map(member => (
                      <option key={member.user.id} value={member.user.id}>{member.user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-shiraz-950 mb-2 pl-3">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="w-full bg-shiraz-50 rounded-full px-6 py-4 text-sm font-medium outline-none border-2 border-transparent focus:border-shiraz-300 transition-colors text-shiraz-950 placeholder:text-shiraz-300"
                    placeholder="0.00"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={settleLoading}
                  className="bg-shiraz-950 text-white px-6 py-3.5 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold hover:bg-shiraz-800 transition-colors disabled:opacity-50 mt-2"
                >
                  {settleLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-white rounded-full p-1.5 shadow-sm border border-shiraz-100 w-fit">
          {['expenses', 'balances', 'members'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-shiraz-950 text-white shadow-md' 
                  : 'text-shiraz-600 hover:text-shiraz-950 hover:bg-shiraz-50'
              }`}
            >
              {tab}
              {tab === 'expenses' && expenses.length > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[8px] ${activeTab === tab ? 'bg-white/20' : 'bg-shiraz-100'}`}>
                  {expenses.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB: Expenses */}
        {activeTab === 'expenses' && (
          <div className="flex flex-col gap-3">
            {expenses.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-shiraz-100">
                <div className="w-16 h-16 bg-shiraz-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-shiraz-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>
                </div>
                <h3 className="font-anton text-xl text-shiraz-950 mb-2">NO EXPENSES YET</h3>
                <p className="text-sm text-shiraz-500 mb-6 max-w-xs mx-auto">Add your first shared expense to start tracking who owes who.</p>
                <Link href={`/groups/${params.id}/add`}>
                  <Button variant="primary">Add First Expense</Button>
                </Link>
              </div>
            ) : (
              expenses.map((expense) => {
                const paidByName = expense.payer?.id === user?.id ? 'You' : (expense.payer?.name || 'Unknown');
                const dateObj = new Date(expense.createdAt);
                const month = dateObj.toLocaleString('default', { month: 'short' });
                const day = dateObj.getDate();

                return (
                  <div key={expense.id} className="bg-white rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 justify-between border border-transparent hover:border-shiraz-100 group cursor-pointer">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="bg-shiraz-50 text-shiraz-950 rounded-xl w-12 h-12 flex flex-col items-center justify-center shrink-0 group-hover:bg-shiraz-100 transition-colors">
                        <span className="text-[8px] font-bold uppercase tracking-widest leading-none text-shiraz-500">{month}</span>
                        <span className="font-anton text-lg leading-none">{day}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-shiraz-950 truncate">{expense.description}</h3>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-shiraz-400 mt-0.5">
                          <span className={paidByName === 'You' ? 'text-shiraz-600' : ''}>{paidByName}</span> paid
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <p className="font-anton text-xl md:text-2xl text-shiraz-950">${Number(expense.amount).toFixed(2)}</p>
                      <p className="text-[9px] uppercase tracking-widest font-bold text-shiraz-300">{expense.splitType}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB: Balances */}
        {activeTab === 'balances' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Net Balances */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-shiraz-100">
              <h3 className="font-anton text-xl text-shiraz-950 mb-6">NET BALANCES</h3>
              <div className="flex flex-col gap-4">
                {balances.length === 0 ? (
                  <p className="text-sm text-shiraz-500 text-center py-4">No balances to show.</p>
                ) : (
                  balances.map((balance) => {
                    const isMe = balance.userId === user?.id;
                    const amt = Number(balance.net_balance);
                    const isPositive = amt > 0.01;
                    const isNegative = amt < -0.01;
                    const isZero = !isPositive && !isNegative;

                    return (
                      <div key={balance.userId} className="flex items-center justify-between py-3 border-b border-shiraz-50 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold uppercase ${
                            isMe ? 'bg-shiraz-950 text-white' : 'bg-shiraz-100 text-shiraz-700'
                          }`}>
                            {balance.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-shiraz-950">
                              {isMe ? 'You' : balance.name}
                            </p>
                            <p className="text-[9px] uppercase tracking-widest font-bold text-shiraz-400">
                              {isZero ? 'Settled' : isPositive ? 'Is owed' : 'Owes'}
                            </p>
                          </div>
                        </div>
                        <p className={`font-anton text-xl ${isPositive ? 'text-green-600' : isNegative ? 'text-shiraz-500' : 'text-shiraz-300'}`}>
                          {isZero ? '$0.00' : `${isPositive ? '+' : '-'}$${Math.abs(amt).toFixed(2)}`}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Simplified Debts */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-shiraz-100">
              <h3 className="font-anton text-xl text-shiraz-950 mb-2">WHO PAYS WHO</h3>
              <p className="text-[10px] uppercase tracking-widest font-bold text-shiraz-400 mb-6">Simplified settlements</p>
              <div className="flex flex-col gap-4">
                {debts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg">✅</span>
                    </div>
                    <p className="text-sm font-bold text-green-700">All settled up!</p>
                    <p className="text-xs text-shiraz-400 mt-1">No outstanding debts</p>
                  </div>
                ) : (
                  debts.map((debt, i) => {
                    const fromName = debt.from?.id === user?.id ? 'You' : debt.from?.name;
                    const toName = debt.to?.id === user?.id ? 'You' : debt.to?.name;
                    return (
                      <div key={i} className="flex items-center gap-3 py-3 border-b border-shiraz-50 last:border-b-0">
                        <div className="w-8 h-8 rounded-full bg-shiraz-100 flex items-center justify-center text-[10px] font-bold uppercase text-shiraz-700">
                          {debt.from?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-shiraz-950 truncate">
                            {fromName} <span className="text-shiraz-400 font-normal">→</span> {toName}
                          </p>
                        </div>
                        <p className="font-anton text-lg text-shiraz-950 shrink-0">${debt.amount.toFixed(2)}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Members */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-shiraz-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-anton text-xl text-shiraz-950">MEMBERS ({group.members.length})</h3>
              <button 
                onClick={() => setShowAddMember(true)}
                className="bg-shiraz-950 text-white px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold hover:bg-shiraz-800 transition-colors"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {group.members.map((member) => {
                const isMe = member.user.id === user?.id;
                const isAdmin = member.role === 'ADMIN';
                return (
                  <div key={member.user.id} className="flex items-center justify-between py-3 border-b border-shiraz-50 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold uppercase ${
                        isMe ? 'bg-shiraz-950 text-white' : 'bg-shiraz-100 text-shiraz-700'
                      }`}>
                        {member.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-shiraz-950">{isMe ? `${member.user.name} (You)` : member.user.name}</p>
                        <p className="text-[10px] text-shiraz-400">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <span className="bg-shiraz-100 text-shiraz-700 px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-bold">Admin</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
