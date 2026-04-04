import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Mail, Lock, User, Globe } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CURRENCIES } from '@/utils/currencyData';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    currency_preference: 'USD'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const { data } = await axios.post(`${API}${endpoint}`, payload);
      onLogin(data.user, data.token);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#4A6B53] rounded-2xl mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-['Outfit'] font-semibold text-[#2C2825] mb-2">
            Budget Sphere
          </h1>
          <p className="text-[#6E6A64] font-['Manrope']">
            Your intelligent financial companion
          </p>
        </div>

        {/* Auth Card */}
        <div className="surface-card">
          <div className="mb-6">
            <h2 className="text-2xl font-['Outfit'] font-semibold text-[#2C2825] mb-1">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-[#6E6A64] font-['Manrope']">
              {isLogin ? 'Sign in to continue' : 'Start your financial journey'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#2C2825] font-['Manrope']">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-[#6E6A64]" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 border-[#E6E3D8] focus:border-[#4A6B53] font-['Manrope']"
                    required={!isLogin}
                    data-testid="name-input"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#2C2825] font-['Manrope']">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-[#6E6A64]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 border-[#E6E3D8] focus:border-[#4A6B53] font-['Manrope']"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#2C2825] font-['Manrope']">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-[#6E6A64]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 border-[#E6E3D8] focus:border-[#4A6B53] font-['Manrope']"
                  required
                  data-testid="password-input"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-[#2C2825] font-['Manrope']">
                  Preferred Currency
                </Label>
                <Select
                  value={formData.currency_preference}
                  onValueChange={(value) => setFormData({ ...formData, currency_preference: value })}
                >
                  <SelectTrigger className="border-[#E6E3D8] focus:border-[#4A6B53]" data-testid="currency-select">
                    <Globe className="mr-2 h-4 w-4 text-[#6E6A64]" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4A6B53] hover:bg-[#3d5843] text-white rounded-full h-12 font-['Manrope'] font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              data-testid="submit-button"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-[#4A6B53] hover:text-[#3d5843] font-['Manrope'] font-medium transition-colors duration-300"
              data-testid="toggle-auth-mode"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        {/* Demo credentials hint */}
        {isLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-[#E6E3D8]"
          >
            <p className="text-xs text-[#6E6A64] font-['Manrope'] text-center">
              New here? Create an account to get started with AI-powered budgeting!
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AuthPage;