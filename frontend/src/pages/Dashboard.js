import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { apiClient } from '@/App';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertCircle,
  Sparkles,
  Plus,
  Send,
  Calculator
} from 'lucide-react';
import { getCurrencySymbol } from '@/utils/currencyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const Dashboard = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [financialProfile, setFinancialProfile] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  
  // NLP Input
  const [nlpInput, setNlpInput] = useState('');
  const [nlpLoading, setNlpLoading] = useState(false);
  
  // Affordability Check
  const [affordItem, setAffordItem] = useState('');
  const [affordPrice, setAffordPrice] = useState('');
  const [affordResult, setAffordResult] = useState(null);
  const [affordLoading, setAffordLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data
      const [
        summaryRes,
        profileRes,
        healthRes,
        transactionsRes,
        goalsRes
      ] = await Promise.all([
        apiClient.get('/accounts/summary'),
        apiClient.get('/ai/financial-profile'),
        apiClient.get('/ai/health-score'),
        apiClient.get('/transactions?limit=5'),
        apiClient.get('/goals')
      ]);

      setSummary(summaryRes.data);
      setFinancialProfile(profileRes.data);
      setHealthScore(healthRes.data);
      setRecentTransactions(transactionsRes.data);
      setGoals(goalsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleNLPSubmit = async (e) => {
    e.preventDefault();
    if (!nlpInput.trim()) return;

    setNlpLoading(true);
    try {
      // Parse with AI
      const { data: parsed } = await apiClient.post('/ai/parse-expense', { text: nlpInput });
      
      // Get first account
      const accounts = summary?.accounts || [];
      if (accounts.length === 0) {
        toast.error('Please create an account first');
        setNlpLoading(false);
        return;
      }

      // Create transaction
      await apiClient.post('/transactions', {
        account_id: accounts[0].id,
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description,
        date: parsed.date,
        type: 'expense',
        currency: user.currency_preference
      });

      toast.success('Expense added successfully!');
      setNlpInput('');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to process expense');
    } finally {
      setNlpLoading(false);
    }
  };

  const handleAffordabilityCheck = async () => {
    if (!affordItem || !affordPrice) {
      toast.error('Please enter item name and price');
      return;
    }

    setAffordLoading(true);
    try {
      const { data } = await apiClient.post('/ai/afford-check', {
        item_name: affordItem,
        price: parseFloat(affordPrice),
        currency: user.currency_preference
      });
      setAffordResult(data);
    } catch (error) {
      toast.error('Failed to check affordability');
    } finally {
      setAffordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F2]">
        <Header user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-[#4A6B53] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(user.currency_preference);

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <Header user={user} onLogout={onLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Health Score & Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-['Outfit'] font-semibold text-[#2C2825] tracking-tight mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-[#6E6A64] font-['Manrope']">Here's your financial overview</p>
        </motion.div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {/* Financial Health Score - Large Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 lg:col-span-2"
          >
            <Card className="surface-card card-hover border-[#E6E3D8] h-full" data-testid="health-score-card">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit'] text-[#2C2825]">
                  Financial Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="text-6xl lg:text-7xl font-['Outfit'] font-bold text-[#4A6B53] mb-2 count-up tracking-tighter"
                  >
                    {healthScore?.score || 0}
                  </motion.div>
                  <p className="text-sm text-[#6E6A64] font-['Manrope'] uppercase tracking-[0.2em] mb-4">
                    {healthScore?.grade || 'N/A'}
                  </p>
                  <Progress value={healthScore?.score || 0} className="h-2 mb-4" />
                  
                  {/* Profile Badge */}
                  {financialProfile && (
                    <div className="inline-flex items-center space-x-2 bg-[#F0EEE7] px-4 py-2 rounded-full">
                      <Sparkles className="w-4 h-4 text-[#A1B5D8]" />
                      <span className="text-sm font-['Manrope'] font-medium text-[#2C2825]">
                        You are a {financialProfile.profile_type}
                      </span>
                    </div>
                  )}
                  
                  {financialProfile && (
                    <p className="text-sm text-[#6E6A64] font-['Manrope'] mt-3">
                      {financialProfile.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Balance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="surface-card card-hover border-[#E6E3D8] h-full" data-testid="balance-card">
              <CardHeader>
                <CardTitle className="text-sm font-['Manrope'] text-[#6E6A64] font-normal">
                  Total Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-8 h-8 text-[#4A6B53]" />
                  <div>
                    <p className="text-3xl font-['Outfit'] font-semibold text-[#2C2825]">
                      {currencySymbol}{summary?.total_balance?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-[#6E6A64] font-['Manrope'] mt-1">
                      Across {summary?.account_count || 0} accounts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Goals */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="surface-card card-hover border-[#E6E3D8] h-full" data-testid="goals-card">
              <CardHeader>
                <CardTitle className="text-sm font-['Manrope'] text-[#6E6A64] font-normal">
                  Active Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Target className="w-8 h-8 text-[#D4A373]" />
                  <div>
                    <p className="text-3xl font-['Outfit'] font-semibold text-[#2C2825]">
                      {goals.length}
                    </p>
                    <p className="text-xs text-[#6E6A64] font-['Manrope'] mt-1">
                      Goals in progress
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* NLP Expense Entry - Full Width */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-3 lg:col-span-4"
          >
            <Card className="surface-card border-[#E6E3D8]" data-testid="nlp-expense-card">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit'] text-[#2C2825] flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#A1B5D8]" />
                  <span>Quick Add Expense (Natural Language)</span>
                </CardTitle>
                <CardDescription className="font-['Manrope']">
                  Type naturally like "Spent 50 on groceries yesterday"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleNLPSubmit} className="flex space-x-2">
                  <Input
                    placeholder="e.g., Spent 50 on food yesterday, Paid 100 for uber today..."
                    value={nlpInput}
                    onChange={(e) => setNlpInput(e.target.value)}
                    className="flex-1 border-[#E6E3D8] focus:border-[#4A6B53] font-['Manrope'] h-12"
                    disabled={nlpLoading}
                    data-testid="nlp-expense-input"
                  />
                  <Button
                    type="submit"
                    disabled={nlpLoading}
                    className="bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full px-6 font-['Manrope'] h-12"
                    data-testid="nlp-submit-button"
                  >
                    {nlpLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Add
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Affordability Calculator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="md:col-span-2 lg:col-span-2"
          >
            <Card className="surface-card border-[#E6E3D8] h-full" data-testid="affordability-card">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit'] text-[#2C2825] flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-[#A1B5D8]" />
                  <span>Can I Afford This?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Item name (e.g., New iPhone)"
                  value={affordItem}
                  onChange={(e) => setAffordItem(e.target.value)}
                  className="border-[#E6E3D8] focus:border-[#4A6B53] font-['Manrope']"
                  data-testid="afford-item-input"
                />
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Price"
                    value={affordPrice}
                    onChange={(e) => setAffordPrice(e.target.value)}
                    className="flex-1 border-[#E6E3D8] focus:border-[#4A6B53] font-['Manrope']"
                    data-testid="afford-price-input"
                  />
                  <Button
                    onClick={handleAffordabilityCheck}
                    disabled={affordLoading}
                    className="bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full px-6 font-['Manrope']"
                    data-testid="afford-check-button"
                  >
                    {affordLoading ? '...' : 'Check'}
                  </Button>
                </div>
                
                {affordResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${
                      affordResult.status === 'affordable'
                        ? 'bg-[#4A6B53]/10 border-[#4A6B53]'
                        : affordResult.status === 'risky'
                        ? 'bg-[#D4A373]/10 border-[#D4A373]'
                        : 'bg-[#CC6C5B]/10 border-[#CC6C5B]'
                    }`}
                    data-testid="afford-result"
                  >
                    <p className="text-sm font-['Manrope'] text-[#2C2825]">{affordResult.message}</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 }}
            className="md:col-span-3 lg:col-span-4"
          >
            <Card className="surface-card border-[#E6E3D8]" data-testid="recent-transactions-card">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit'] text-[#2C2825]">
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#6E6A64] font-['Manrope'] mb-4">No transactions yet</p>
                    <Button
                      onClick={() => window.location.href = '/transactions'}
                      className="bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Transaction
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F0EEE7] transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'income' ? 'bg-[#4A6B53]/10' : 'bg-[#CC6C5B]/10'
                          }`}>
                            {tx.type === 'income' ? (
                              <TrendingUp className="w-5 h-5 text-[#4A6B53]" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-[#CC6C5B]" />
                            )}
                          </div>
                          <div>
                            <p className="font-['Manrope'] font-medium text-[#2C2825]">
                              {tx.description}
                            </p>
                            <p className="text-xs text-[#6E6A64] font-['Manrope']">
                              {tx.category} • {new Date(tx.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className={`font-['Manrope'] font-semibold ${
                          tx.type === 'income' ? 'text-[#4A6B53]' : 'text-[#CC6C5B]'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
