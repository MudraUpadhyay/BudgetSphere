import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { apiClient } from '@/App';
import { toast } from 'sonner';
import { TrendingUp, Sparkles, Brain, PieChart as PieChartIcon } from 'lucide-react';
import { getCurrencySymbol } from '@/utils/currencyData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const Insights = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, predictionsRes, healthRes, statsRes] = await Promise.all([
        apiClient.get('/ai/financial-profile'),
        apiClient.get('/ai/predict-expenses'),
        apiClient.get('/ai/health-score'),
        apiClient.get('/transactions/stats')
      ]);
      setProfile(profileRes.data);
      setPredictions(predictionsRes.data);
      setHealthScore(healthRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
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

  // Prepare chart data
  const categoryData = stats?.category_breakdown
    ? Object.entries(stats.category_breakdown).map(([name, value]) => ({
        name,
        amount: value
      }))
    : [];

  const predictionData = predictions?.category_predictions
    ? Object.entries(predictions.category_predictions).map(([name, value]) => ({
        name,
        predicted: value
      }))
    : [];

  // Pie chart colors
  const COLORS = ['#4A6B53', '#D4A373', '#CC6C5B', '#A1B5D8', '#8B9D83', '#C89F7F'];

  // Combined data for comparison chart
  const comparisonData = categoryData.map((cat, idx) => ({
    name: cat.name,
    current: cat.amount,
    predicted: predictionData.find(p => p.name === cat.name)?.predicted || 0
  }));

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <Header user={user} onLogout={onLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-['Outfit'] font-semibold text-[#2C2825] tracking-tight">AI Insights</h1>
          <p className="text-[#6E6A64] font-['Manrope'] mt-1">Powered by intelligent financial analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Profile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="surface-card border-[#E6E3D8] h-full" data-testid="profile-card">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit'] text-[#2C2825] flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-[#A1B5D8]" />
                  <span>Financial Behavior Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile ? (
                  <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 bg-[#F0EEE7] px-6 py-3 rounded-full">
                      <Sparkles className="w-5 h-5 text-[#A1B5D8]" />
                      <span className="text-xl font-['Outfit'] font-semibold text-[#2C2825]">
                        {profile.profile_type}
                      </span>
                    </div>
                    <p className="text-[#6E6A64] font-['Manrope'] leading-relaxed">
                      {profile.description}
                    </p>
                    <div className="p-4 bg-[#F0EEE7] rounded-lg">
                      <p className="text-sm font-['Manrope'] font-medium text-[#2C2825] mb-2">
                        Savings Ratio: {profile.savings_ratio?.toFixed(1)}%
                      </p>
                      <p className="text-sm font-['Manrope'] font-medium text-[#2C2825]">
                        Profile Score: {profile.score}/100
                      </p>
                    </div>
                    {profile.suggestions && profile.suggestions.length > 0 && (
                      <div>
                        <p className="text-sm font-['Manrope'] font-medium text-[#2C2825] mb-2">Suggestions:</p>
                        <ul className="space-y-2">
                          {profile.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-[#6E6A64] font-['Manrope'] flex items-start space-x-2">
                              <span className="text-[#4A6B53] mt-1">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[#6E6A64] font-['Manrope']">No profile data available</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Health Score Breakdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="surface-card border-[#E6E3D8] h-full" data-testid="health-breakdown-card">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit'] text-[#2C2825]">
                  Health Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthScore ? (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <p className="text-5xl font-['Outfit'] font-bold text-[#4A6B53]">
                        {healthScore.score}
                      </p>
                      <p className="text-sm text-[#6E6A64] font-['Manrope'] uppercase tracking-wider mt-1">
                        {healthScore.grade}
                      </p>
                    </div>
                    {healthScore.factors?.map((factor, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#2C2825] font-['Manrope'] font-medium">{factor.name}</span>
                          <span className="text-[#6E6A64] font-['Manrope']">
                            {factor.score}/{factor.max}
                          </span>
                        </div>
                        <div className="h-2 bg-[#F0EEE7] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4A6B53] rounded-full transition-all duration-500"
                            style={{ width: `${(factor.score / factor.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#6E6A64] font-['Manrope']">No health data available</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Spending */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="surface-card border-[#E6E3D8]" data-testid="spending-chart">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit'] text-[#2C2825]">
                  Spending by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E6E3D8" />
                      <XAxis
                        dataKey="name"
                        stroke="#6E6A64"
                        style={{ fontFamily: 'Manrope', fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#6E6A64"
                        style={{ fontFamily: 'Manrope', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E6E3D8',
                          borderRadius: '12px',
                          fontFamily: 'Manrope'
                        }}
                      />
                      <Bar dataKey="amount" fill="#4A6B53" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-[#6E6A64] font-['Manrope'] py-12">
                    No spending data available
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Expense Predictions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="surface-card border-[#E6E3D8] h-full" data-testid="predictions-card">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit'] text-[#2C2825] flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-[#A1B5D8]" />
                  <span>Next Month Prediction</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {predictions && predictions.predicted_total > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-[#F0EEE7] rounded-lg">
                      <p className="text-sm text-[#6E6A64] font-['Manrope'] mb-1">Expected Total</p>
                      <p className="text-3xl font-['Outfit'] font-semibold text-[#2C2825]">
                        {currencySymbol}{predictions.predicted_total.toFixed(2)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {predictionData.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-[#E6E3D8] last:border-0">
                          <span className="text-sm font-['Manrope'] text-[#2C2825]">{item.name}</span>
                          <span className="text-sm font-['Manrope'] font-medium text-[#6E6A64]">
                            {currencySymbol}{item.predicted.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[#6E6A64] font-['Manrope'] text-center py-8">
                    Not enough data for predictions
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pie Chart - Category Distribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="surface-card border-[#E6E3D8] h-full">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit'] text-[#2C2825] flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5 text-[#A1B5D8]" />
                  <span>Expense Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E6E3D8',
                          borderRadius: '12px',
                          fontFamily: 'Manrope'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-[#6E6A64] font-['Manrope'] py-12">
                    No data available
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Comparison Chart - Current vs Predicted */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <Card className="surface-card border-[#E6E3D8]">
              <CardHeader>
                <CardTitle className="text-lg font-['Outfit'] text-[#2C2825]">
                  Current vs Predicted Spending
                </CardTitle>
              </CardHeader>
              <CardContent>
                {comparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E6E3D8" />
                      <XAxis
                        dataKey="name"
                        stroke="#6E6A64"
                        style={{ fontFamily: 'Manrope', fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#6E6A64"
                        style={{ fontFamily: 'Manrope', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E6E3D8',
                          borderRadius: '12px',
                          fontFamily: 'Manrope'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="current" stroke="#4A6B53" strokeWidth={2} name="Current" />
                      <Line type="monotone" dataKey="predicted" stroke="#D4A373" strokeWidth={2} strokeDasharray="5 5" name="Predicted" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-[#6E6A64] font-['Manrope'] py-12">
                    No comparison data available
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Insights;