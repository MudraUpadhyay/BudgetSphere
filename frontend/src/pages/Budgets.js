import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { apiClient } from '@/App';
import { toast } from 'sonner';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { getCurrencySymbol, CATEGORIES } from '@/utils/currencyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

const Budgets = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [newLimit, setNewLimit] = useState('');
  const [formData, setFormData] = useState({
    category: 'Other',
    monthly_limit: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetsRes, suggestionsRes, alertsRes] = await Promise.all([
        apiClient.get('/budgets'),
        apiClient.post('/ai/suggest-budget'),
        apiClient.get('/budgets/check-alerts')
      ]);
      setBudgets(budgetsRes.data);
      setSuggestions(suggestionsRes.data.suggestions || []);
      setAlerts(alertsRes.data.alerts || []);
    } catch (error) {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/budgets', {
        ...formData,
        monthly_limit: parseFloat(formData.monthly_limit),
        currency: user.currency_preference
      });
      toast.success('Budget created!');
      setOpen(false);
      setFormData({ category: 'Other', monthly_limit: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to create budget');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await apiClient.delete(`/budgets/${id}`);
      toast.success('Budget deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete budget');
    }
  };

  const applySuggestion = (suggestion) => {
    setFormData({
      category: suggestion.category,
      monthly_limit: suggestion.suggested_budget.toString()
    });
    setOpen(true);
  };

  const handleExtendLimit = async () => {
    if (!newLimit || parseFloat(newLimit) <= 0) {
      toast.error('Please enter a valid limit');
      return;
    }
    
    try {
      await apiClient.put(`/budgets/${selectedBudget.id}/extend`, null, {
        params: { new_limit: parseFloat(newLimit) }
      });
      toast.success('Budget limit extended!');
      setExtendOpen(false);
      setNewLimit('');
      setSelectedBudget(null);
      loadData();
    } catch (error) {
      toast.error('Failed to extend limit');
    }
  };

  const openExtendDialog = (budget) => {
    setSelectedBudget(budget);
    setNewLimit(budget.monthly_limit.toString());
    setExtendOpen(true);
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
            <h1 className="text-4xl font-['Outfit'] font-semibold text-[#2C2825] tracking-tight">Budgets</h1>
            <p className="text-[#6E6A64] font-['Manrope'] mt-1">Set and track your spending limits</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']" data-testid="add-budget-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-['Outfit']">Create Budget</DialogTitle>
                <DialogDescription className="font-['Manrope']">
                  Set a monthly spending limit for a category
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-['Manrope']">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger data-testid="category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => !['Salary', 'Investment'].includes(c)).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-['Manrope']">Monthly Limit ({currencySymbol})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.monthly_limit}
                    onChange={(e) => setFormData({...formData, monthly_limit: e.target.value})}
                    className="font-['Manrope']"
                    required
                    data-testid="limit-input"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']" data-testid="submit-budget-button">
                  Create Budget
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="surface-card border-[#E6E3D8]">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit'] text-[#2C2825] flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#A1B5D8]" />
                  <span>AI Budget Suggestions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 bg-[#F0EEE7] rounded-lg border border-[#E6E3D8]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-['Manrope'] font-medium text-[#2C2825]">{suggestion.category}</p>
                        <Button
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                          className="bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full text-xs font-['Manrope']"
                          data-testid={`apply-suggestion-${index}`}
                        >
                          Apply
                        </Button>
                      </div>
                      <p className="text-sm text-[#6E6A64] font-['Manrope']">
                        Avg: {currencySymbol}{suggestion.current_average.toFixed(2)} → Suggested: {currencySymbol}{suggestion.suggested_budget.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Budget Alerts */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="surface-card border-[#E6E3D8]">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit'] text-[#2C2825]">
                  Budget Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.status === 'exceeded'
                          ? 'bg-[#CC6C5B]/10 border-[#CC6C5B]'
                          : 'bg-[#D4A373]/10 border-[#D4A373]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-['Manrope'] font-medium text-[#2C2825] mb-1">
                            {alert.category} Budget {alert.status === 'exceeded' ? 'Exceeded' : 'Warning'}
                          </p>
                          <p className="text-sm text-[#6E6A64] font-['Manrope']">
                            Spent: {currencySymbol}{alert.spent.toFixed(2)} / {currencySymbol}{alert.limit.toFixed(2)} ({alert.percentage}%)
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            const budget = budgets.find(b => b.id === alert.budget_id);
                            if (budget) openExtendDialog(budget);
                          }}
                          className="bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']"
                        >
                          Extend Limit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Budgets List */}
        {budgets.length === 0 ? (
          <Card className="surface-card border-[#E6E3D8]">
            <CardContent className="text-center py-12">
              <p className="text-[#6E6A64] font-['Manrope'] mb-4">No budgets created yet</p>
              <Button
                onClick={() => setOpen(true)}
                className="bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget, index) => (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="surface-card border-[#E6E3D8] card-hover h-full" data-testid={`budget-card-${index}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-['Outfit'] text-[#2C2825]">
                        {budget.category}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(budget.id)}
                        className="text-[#CC6C5B] hover:text-[#b55a49] hover:bg-[#CC6C5B]/10"
                        data-testid={`delete-budget-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-['Outfit'] font-semibold text-[#2C2825] mb-2">
                      {currencySymbol}{budget.monthly_limit.toFixed(2)}
                    </p>
                    <p className="text-sm text-[#6E6A64] font-['Manrope'] mb-4">Monthly Limit</p>
                    <Progress value={50} className="h-2" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Extend Limit Dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Outfit']">Extend Budget Limit</DialogTitle>
            <DialogDescription className="font-['Manrope']">
              {selectedBudget && `Current limit for ${selectedBudget.category}: ${currencySymbol}${selectedBudget.monthly_limit.toFixed(2)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-['Manrope']">New Monthly Limit ({currencySymbol})</Label>
              <Input
                type="number"
                step="0.01"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                className="font-['Manrope']"
                placeholder="Enter new limit"
              />
            </div>
            <Button 
              onClick={handleExtendLimit} 
              className="w-full bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']"
            >
              Extend Limit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Budgets;