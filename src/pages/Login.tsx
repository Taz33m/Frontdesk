import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

// Utility function to combine class names
const cn = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { login, signup, error: authError, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      await signup(email, password);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6 sm:p-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={isLogin ? 'login' : 'signup'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-xs sm:max-w-sm mx-auto"
        >
          <Card className="overflow-hidden border border-gray-100 shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
              <div className="flex items-center justify-center">
                <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <CardContent className="pt-8 px-6 sm:px-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-start space-x-2"
                    >
                      <span className="mt-0.5">⚠️</span>
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ 
                      opacity: 1, 
                      height: 'auto',
                      marginBottom: '1.5rem',
                      transition: { delay: 0.1 }
                    }}
                    exit={{ 
                      opacity: 0, 
                      height: 0, 
                      marginBottom: 0,
                      transition: { duration: 0.2 }
                    }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          className="pl-10"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {isLogin && (
                      <Link 
                        to="/forgot-password" 
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      required
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
                      <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                    </label>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full group"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center border-t border-gray-100 bg-gray-50 px-6 py-5">
              <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="font-medium text-blue-600 hover:underline focus:outline-none"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Login;
