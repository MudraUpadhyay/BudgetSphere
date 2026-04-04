import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  CreditCard, 
  Target, 
  TrendingUp, 
  Wallet, 
  LineChart,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Header = ({ user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transactions', icon: CreditCard, label: 'Transactions' },
    { path: '/budgets', icon: LineChart, label: 'Budgets' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/insights', icon: TrendingUp, label: 'Insights' },
    { path: '/accounts', icon: Wallet, label: 'Accounts' },
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
          <Link to="/dashboard" className="flex items-center space-x-3" data-testid="logo-link">
            <img 
              src="https://static.prod-images.emergentagent.com/jobs/6798122a-09d3-486d-a432-6c502b68eaf2/images/41e02ae0b59a0b2d643d18effc815474a698dc6b7872a079d106ad1e447d854f.png" 
              alt="Budget Sphere" 
              className="w-10 h-10 rounded-xl"
            />
            <span className="text-xl font-['Outfit'] font-bold text-teal-600 hidden sm:block">
              Budget Sphere
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
                      ? 'bg-teal-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-teal-50'
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
              <DropdownMenuItem asChild className="cursor-pointer" data-testid="profile-menu-item">
                <Link to="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span className="font-['Manrope']">Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer text-red-500 hover:text-red-600"
                data-testid="logout-button"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="font-['Manrope']">Logout</span>
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
                isActive ? 'text-teal-600' : 'text-gray-600'
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