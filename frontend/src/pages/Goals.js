import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { apiClient } from '@/App';
import { toast } from 'sonner';
import { Plus, Trash2, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { getCurrencySymbol } from '@/utils/currencyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

const Goals = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [open, setOpen] = useState(false);
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [moneyToAdd, setMoneyToAdd] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    deadline: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/goals');
      setGoals(data);
      
      // Load predictions for each goal
      const preds = {};
      for (const goal of data) {
        try {
          const { data: pred } = await apiClient.get(`/ai/goal-risk/${goal.id}`);
          preds[goal.id] = pred;
        } catch (error) {
          console.error(`Failed to load prediction for goal ${goal.id}`);
        }
      }
      setPredictions(preds);
    } catch (error) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/goals', {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount),
        currency: user.currency_preference
      });
      toast.success('Goal created!');
      setOpen(false);
      setFormData({ name: '', target_amount: '', current_amount: '0', deadline: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to create goal');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await apiClient.delete(`/goals/${id}`);
      toast.success('Goal deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete goal');
    }
  };

  const handleUpdateProgress = async (goalId, newAmount) => {
    try {
      await apiClient.put(`/goals/${goalId}`, null, {
        params: { current_amount: newAmount }
      });
      toast.success('Progress updated!');
      loadData();
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const openAddMoneyDialog = (goal) => {
    setSelectedGoal(goal);
    setMoneyToAdd('');
    setAddMoneyOpen(true);
  };

  const handleAddMoney = async () => {
    if (!moneyToAdd || parseFloat(moneyToAdd) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const newAmount = selectedGoal.current_amount + parseFloat(moneyToAdd);
    await handleUpdateProgress(selectedGoal.id, newAmount);
    setAddMoneyOpen(false);
    setMoneyToAdd('');
    setSelectedGoal(null);
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
            <h1 className="text-4xl font-['Outfit'] font-semibold text-[#2C2825] tracking-tight">Savings Goals</h1>
            <p className="text-[#6E6A64] font-['Manrope'] mt-1">Track your financial milestones</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']" data-testid="add-goal-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-['Outfit']">Create Savings Goal</DialogTitle>
                <DialogDescription className="font-['Manrope']">
                  Set a financial target to achieve
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-['Manrope']">Goal Name</Label>
                  <Input
                    placeholder="e.g., Vacation, New Car, Emergency Fund"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="font-['Manrope']"
                    required
                    data-testid="goal-name-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-['Manrope']">Target Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="10000"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                      className="font-['Manrope']"
                      required
                      data-testid="target-amount-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-['Manrope']">Current Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={formData.current_amount}
                      onChange={(e) => setFormData({...formData, current_amount: e.target.value})}
                      className="font-['Manrope']"
                      data-testid="current-amount-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-['Manrope']">Deadline</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    className="font-['Manrope']"
                    required
                    data-testid="deadline-input"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']" data-testid="submit-goal-button">
                  Create Goal
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Goals List */}
        {goals.length === 0 ? (
          <Card className="surface-card border-[#E6E3D8]">
            <CardContent className="text-center py-12">
              <Target className="w-16 h-16 text-[#D4A373] mx-auto mb-4" />
              <p className="text-[#6E6A64] font-['Manrope'] mb-4">No goals created yet</p>
              <Button
                onClick={() => setOpen(true)}
                className="bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal, index) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const prediction = predictions[goal.id];
              
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="surface-card border-[#E6E3D8] card-hover h-full" data-testid={`goal-card-${index}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Target className="w-5 h-5 text-[#D4A373]" />
                          <CardTitle className="text-lg font-['Outfit'] text-[#2C2825]">
                            {goal.name}
                          </CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAddMoneyDialog(goal)}
                            className="text-[#4A6B53] hover:text-[#3d5843] hover:bg-[#4A6B53]/10"
                            data-testid={`add-money-${index}`}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Money
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(goal.id)}
                            className="text-[#CC6C5B] hover:text-[#b55a49] hover:bg-[#CC6C5B]/10"
                            data-testid={`delete-goal-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#6E6A64] font-['Manrope']">Progress</span>
                          <span className="text-sm font-['Manrope'] font-medium text-[#2C2825]">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={progress} className="h-3 mb-2" />
                        <div className="flex items-center justify-between text-sm font-['Manrope']">
                          <span className="text-[#6E6A64]">{currencySymbol}{goal.current_amount.toFixed(2)}</span>
                          <span className="text-[#2C2825] font-medium">{currencySymbol}{goal.target_amount.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#E6E3D8]">
                        <p className="text-xs text-[#6E6A64] font-['Manrope'] mb-2">
                          Deadline: {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                        
                        {prediction && (
                          <div className={`p-3 rounded-lg border ${
                            prediction.status === 'on_track'
                              ? 'bg-[#4A6B53]/10 border-[#4A6B53]'
                              : prediction.status === 'tight'
                              ? 'bg-[#D4A373]/10 border-[#D4A373]'
                              : 'bg-[#CC6C5B]/10 border-[#CC6C5B]'
                          }`}>
                            <div className="flex items-start space-x-2">
                              {prediction.status === 'on_track' ? (
                                <CheckCircle className="w-4 h-4 text-[#4A6B53] mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-[#D4A373] mt-0.5" />
                              )}
                              <p className="text-xs font-['Manrope'] text-[#2C2825]">
                                {prediction.message}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Money Dialog */}
      <Dialog open={addMoneyOpen} onOpenChange={setAddMoneyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Outfit']">Add Money to Goal</DialogTitle>
            <DialogDescription className="font-['Manrope']">
              {selectedGoal && `${selectedGoal.name}: ${currencySymbol}${selectedGoal.current_amount.toFixed(2)} / ${currencySymbol}${selectedGoal.target_amount.toFixed(2)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-['Manrope']">Amount to Add ({currencySymbol})</Label>
              <Input
                type="number"
                step="0.01"
                value={moneyToAdd}
                onChange={(e) => setMoneyToAdd(e.target.value)}
                className="font-['Manrope']"
                placeholder="Enter amount"
                data-testid="add-money-input"
              />
            </div>
            <Button 
              onClick={handleAddMoney} 
              className="w-full bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full font-['Manrope']"
              data-testid="submit-add-money"
            >
              Add Money
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Goals;