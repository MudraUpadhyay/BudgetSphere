import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { 
  LayoutDashboard, 
  CreditCard, 
  Target, 
  TrendingUp, 
  Wallet, 
  LineChart,
  LogOut,
  User,
  Moon,
  Sun,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Header = ({ user, onLogout }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/transactions', icon: CreditCard, label: t('transactions') },
    { path: '/budgets', icon: LineChart, label: t('budgets') },
    { path: '/goals', icon: Target, label: t('goals') },
    { path: '/insights', icon: TrendingUp, label: t('insights') },
    { path: '/accounts', icon: Wallet, label: t('accounts') },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-header sticky top-0 z-50"
      data-testid="app-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2" data-testid="logo-link">
            <div className="w-10 h-10 bg-[#4A6B53] dark:bg-[#5a7b63] rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-['Outfit'] font-semibold text-[#2C2825] dark:text-white hidden sm:block">
              {t('appName')}
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1" data-testid="main-navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-[#4A6B53] text-white'
                      : 'text-[#6E6A64] hover:bg-[#F0EEE7] hover:text-[#2C2825]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-['Manrope'] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
                data-testid="user-menu-trigger"
              >
                <Avatar>
                  <AvatarFallback className="bg-[#4A6B53] text-white font-['Outfit']">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-['Outfit'] font-medium text-[#2C2825]">{user?.name}</p>
                  <p className="text-xs text-[#6E6A64] font-['Manrope']">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" data-testid="profile-menu-item">
                <User className="mr-2 h-4 w-4" />
                <span className="font-['Manrope']">{t('profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                <span className="font-['Manrope']">{theme === 'light' ? t('darkMode') : t('lightMode')}</span>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Globe className="mr-2 h-4 w-4" />
                  <span className="font-['Manrope']">{t('language')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => changeLanguage('en')}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('es')}>Español</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('fr')}>Français</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('hi')}>हिन्दी</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer text-[#CC6C5B]"
                data-testid="logout-button"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="font-['Manrope']">{t('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-[#E6E3D8] px-4 py-2 flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-300 ${
                isActive ? 'text-[#4A6B53]' : 'text-[#6E6A64]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-['Manrope']">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </motion.header>
  );
};

export default Header;