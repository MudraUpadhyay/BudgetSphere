import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { apiClient } from '@/App';
import { toast } from 'sonner';
import { Plus, Trash2, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { getCurrencySymbol, CATEGORIES } from '@/utils/currencyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Transactions = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    category: 'Other',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txRes, accountsRes, statsRes] = await Promise.all([
        apiClient.get('/transactions?limit=100'),
        apiClient.get('/accounts'),
        apiClient.get('/transactions/stats')
      ]);
      setTransactions(txRes.data);
      setAccounts(accountsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/transactions', {
        ...formData,
        amount: parseFloat(formData.amount),
        currency: user.currency_preference
      });
      toast.success('Transaction added!');
      setOpen(false);
      setFormData({
        account_id: '',
        amount: '',
        category: 'Other',
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense'
      });
      loadData();
    } catch (error) {
      toast.error('Failed to add transaction');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await apiClient.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const filteredTransactions = transactions.filter(tx =>
    tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currencySymbol = getCurrencySymbol(user.currency_preference);

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

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <Header user={user} onLogout={onLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-['Outfit'] font-semibold text-[#2C2825] tracking-tight">Transactions</h1>
            <p className="text-[#6E6A64] font-['Manrope'] mt-1">Manage your income and expenses</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']" data-testid="add-transaction-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-['Outfit']">Add Transaction</DialogTitle>
                <DialogDescription className="font-['Manrope']">
                  Record a new income or expense
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-['Manrope']">Account</Label>
                  <Select value={formData.account_id} onValueChange={(value) => setFormData({...formData, account_id: value})} required>
                    <SelectTrigger data-testid="account-select">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-['Manrope']">Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger data-testid="type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-['Manrope']">Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="font-['Manrope']"
                      required
                      data-testid="amount-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-['Manrope']">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger data-testid="category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-['Manrope']">Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="font-['Manrope']"
                    required
                    data-testid="description-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-['Manrope']">Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="font-['Manrope']"
                    required
                    data-testid="date-input"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']" data-testid="submit-transaction-button">
                  Add Transaction
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="surface-card border-[#E6E3D8]">
            <CardHeader>
              <CardTitle className="text-sm font-['Manrope'] text-[#6E6A64] font-normal">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-['Outfit'] font-semibold text-[#4A6B53]">
                +{currencySymbol}{stats?.total_income?.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>
          <Card className="surface-card border-[#E6E3D8]">
            <CardHeader>
              <CardTitle className="text-sm font-['Manrope'] text-[#6E6A64] font-normal">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-['Outfit'] font-semibold text-[#CC6C5B]">
                -{currencySymbol}{stats?.total_expenses?.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>
          <Card className="surface-card border-[#E6E3D8]">
            <CardHeader>
              <CardTitle className="text-sm font-['Manrope'] text-[#6E6A64] font-normal">Net Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-['Outfit'] font-semibold text-[#2C2825]">
                {currencySymbol}{stats?.net_savings?.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-[#6E6A64]" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-[#E6E3D8] focus:border-[#4A6B53] font-['Manrope']"
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Transactions List */}
        <Card className="surface-card border-[#E6E3D8]">
          <CardContent className="p-0">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#6E6A64] font-['Manrope']">No transactions found</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E6E3D8]">
                {filteredTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 hover:bg-[#F0EEE7] transition-all duration-300"
                    data-testid={`transaction-item-${index}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        tx.type === 'income' ? 'bg-[#4A6B53]/10' : 'bg-[#CC6C5B]/10'
                      }`}>
                        {tx.type === 'income' ? (
                          <TrendingUp className="w-6 h-6 text-[#4A6B53]" />
                        ) : (
                          <TrendingDown className="w-6 h-6 text-[#CC6C5B]" />
                        )}
                      </div>
                      <div>
                        <p className="font-['Manrope'] font-medium text-[#2C2825]">{tx.description}</p>
                        <p className="text-sm text-[#6E6A64] font-['Manrope']">
                          {tx.category} • {new Date(tx.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className={`font-['Manrope'] font-semibold text-lg ${
                        tx.type === 'income' ? 'text-[#4A6B53]' : 'text-[#CC6C5B]'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tx.id)}
                        className="text-[#CC6C5B] hover:text-[#b55a49] hover:bg-[#CC6C5B]/10"
                        data-testid={`delete-button-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Transactions;