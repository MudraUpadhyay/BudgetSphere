import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { apiClient } from '@/App';
import { toast } from 'sonner';
import { Plus, Trash2, Wallet, CreditCard, PiggyBank, Banknote } from 'lucide-react';
import { getCurrencySymbol, ACCOUNT_TYPES, CURRENCIES } from '@/utils/currencyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Accounts = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    balance: '0',
    currency: user.currency_preference,
    bank_name: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsRes, summaryRes] = await Promise.all([
        apiClient.get('/accounts'),
        apiClient.get('/accounts/summary')
      ]);
      setAccounts(accountsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/accounts', {
        ...formData,
        balance: parseFloat(formData.balance)
      });
      toast.success('Account created!');
      setOpen(false);
      setFormData({
        name: '',
        type: 'checking',
        balance: '0',
        currency: user.currency_preference,
        bank_name: ''
      });
      loadData();
    } catch (error) {
      toast.error('Failed to create account');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this account? All associated transactions will remain.')) return;
    try {
      await apiClient.delete(`/accounts/${id}`);
      toast.success('Account deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'checking':
        return Wallet;
      case 'savings':
        return PiggyBank;
      case 'credit':
        return CreditCard;
      case 'cash':
        return Banknote;
      default:
        return Wallet;
    }
  };

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
            <h1 className="text-4xl font-['Outfit'] font-semibold text-[#2C2825] tracking-tight">Accounts</h1>
            <p className="text-[#6E6A64] font-['Manrope'] mt-1">Manage your bank accounts and wallets</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']" data-testid="add-account-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-['Outfit']">Add Account</DialogTitle>
                <DialogDescription className="font-['Manrope']">
                  Connect a new bank account or wallet
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-['Manrope']">Account Name</Label>
                  <Input
                    placeholder="e.g., Main Checking, Savings Account"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="font-['Manrope']"
                    required
                    data-testid="account-name-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-['Manrope']">Account Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger data-testid="account-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-['Manrope']">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                      <SelectTrigger data-testid="currency-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(curr => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-['Manrope']">Initial Balance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({...formData, balance: e.target.value})}
                    className="font-['Manrope']"
                    data-testid="balance-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-['Manrope']">Bank Name (Optional)</Label>
                  <Input
                    placeholder="e.g., Chase, Bank of America"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                    className="font-['Manrope']"
                    data-testid="bank-name-input"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']" data-testid="submit-account-button">
                  Add Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Total Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="surface-card border-[#E6E3D8]">
            <CardContent className="p-8">
              <div className="text-center">
                <p className="text-sm text-[#6E6A64] font-['Manrope'] uppercase tracking-[0.2em] mb-2">
                  Total Balance
                </p>
                <p className="text-5xl lg:text-6xl font-['Outfit'] font-bold text-[#2C2825] mb-2 tracking-tight">
                  {currencySymbol}{summary?.total_balance?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-[#6E6A64] font-['Manrope']">
                  Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Accounts Grid */}
        {accounts.length === 0 ? (
          <Card className="surface-card border-[#E6E3D8]">
            <CardContent className="text-center py-12">
              <Wallet className="w-16 h-16 text-[#D4A373] mx-auto mb-4" />
              <p className="text-[#6E6A64] font-['Manrope'] mb-4">No accounts added yet</p>
              <Button
                onClick={() => setOpen(true)}
                className="bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account, index) => {
              const Icon = getAccountIcon(account.type);
              const accountCurrencySymbol = getCurrencySymbol(account.currency);
              
              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="surface-card border-[#E6E3D8] card-hover h-full" data-testid={`account-card-${index}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-[#4A6B53]/10 rounded-full flex items-center justify-center">
                            <Icon className="w-6 h-6 text-[#4A6B53]" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-['Outfit'] text-[#2C2825]">
                              {account.name}
                            </CardTitle>
                            <p className="text-xs text-[#6E6A64] font-['Manrope'] capitalize">
                              {account.type}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(account.id)}
                          className="text-[#CC6C5B] hover:text-[#b55a49] hover:bg-[#CC6C5B]/10"
                          data-testid={`delete-account-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-['Outfit'] font-semibold text-gray-800 mb-2">
                        {accountCurrencySymbol}{account.balance.toFixed(2)}
                      </p>
                      {account.bank_name && (
                        <p className="text-sm text-gray-600 font-['Manrope']">{account.bank_name}</p>
                      )}
                      <p className="text-xs text-gray-500 font-['Manrope'] mt-2">
                        Currency: {account.currency}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Accounts;
