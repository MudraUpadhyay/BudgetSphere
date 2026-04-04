import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Branding
      appName: 'Budget Sphere',
      tagline: 'Your intelligent financial companion',
      
      // Navigation
      dashboard: 'Dashboard',
      transactions: 'Transactions',
      budgets: 'Budgets',
      goals: 'Goals',
      insights: 'Insights',
      accounts: 'Accounts',
      
      // Auth
      welcomeBack: 'Welcome Back',
      createAccount: 'Create Account',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      fullName: 'Full Name',
      currency: 'Preferred Currency',
      dontHaveAccount: "Don't have an account? Sign up",
      alreadyHaveAccount: 'Already have an account? Sign in',
      
      // Dashboard
      welcomeBackUser: 'Welcome back',
      financialOverview: "Here's your financial overview",
      financialHealthScore: 'Financial Health Score',
      totalBalance: 'Total Balance',
      activeGoals: 'Active Goals',
      goalsInProgress: 'Goals in progress',
      quickAddExpense: 'Quick Add Expense (Natural Language)',
      typeNaturally: 'Type naturally like "Spent 50 on groceries yesterday"',
      canIAfford: 'Can I Afford This?',
      smartAlerts: 'Smart Alerts',
      recentTransactions: 'Recent Transactions',
      noAlerts: 'No new alerts',
      
      // Common
      add: 'Add',
      delete: 'Delete',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      search: 'Search',
      filter: 'Filter',
      loading: 'Loading...',
      noData: 'No data available',
      
      // Settings
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      language: 'Language',
      logout: 'Logout',
      profile: 'Profile'
    }
  },
  es: {
    translation: {
      appName: 'Budget Sphere',
      tagline: 'Tu compañero financiero inteligente',
      dashboard: 'Tablero',
      transactions: 'Transacciones',
      budgets: 'Presupuestos',
      goals: 'Metas',
      insights: 'Perspectivas',
      accounts: 'Cuentas',
      welcomeBack: 'Bienvenido de nuevo',
      createAccount: 'Crear cuenta',
      signIn: 'Iniciar sesión',
      signUp: 'Registrarse',
      email: 'Correo electrónico',
      password: 'Contraseña',
      fullName: 'Nombre completo',
      currency: 'Moneda preferida',
      financialHealthScore: 'Puntuación de salud financiera',
      totalBalance: 'Balance total',
      add: 'Agregar',
      delete: 'Eliminar',
      logout: 'Cerrar sesión'
    }
  },
  fr: {
    translation: {
      appName: 'Budget Sphere',
      tagline: 'Votre compagnon financier intelligent',
      dashboard: 'Tableau de bord',
      transactions: 'Transactions',
      budgets: 'Budgets',
      goals: 'Objectifs',
      insights: 'Aperçus',
      accounts: 'Comptes',
      welcomeBack: 'Bon retour',
      signIn: 'Se connecter',
      email: 'E-mail',
      password: 'Mot de passe',
      logout: 'Déconnexion'
    }
  },
  hi: {
    translation: {
      appName: 'Budget Sphere',
      tagline: 'आपका बुद्धिमान वित्तीय साथी',
      dashboard: 'डैशबोर्ड',
      transactions: 'लेनदेन',
      budgets: 'बजट',
      goals: 'लक्ष्य',
      insights: 'अंतर्दृष्टि',
      accounts: 'खाते',
      welcomeBack: 'वापसी पर स्वागत है',
      signIn: 'साइन इन करें',
      logout: 'लॉग आउट'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;