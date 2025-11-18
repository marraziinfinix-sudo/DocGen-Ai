import React, { useState } from 'react';
import { ViewIcon, EyeSlashIcon } from './Icons';
import { auth } from '../services/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { createNewUserDocument } from '../services/firebaseService';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        setIsLoading(false);
        return;
    }

    try {
        if (isSignUp) {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await createNewUserDocument(userCredential.user.uid, userCredential.user.email || '');
            // onAuthStateChanged in App.tsx will handle the rest
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged in App.tsx will handle the rest
        }
    } catch (error: any) {
        // More user-friendly error messages
        switch (error.code) {
            case 'auth/invalid-email':
                setError('Please enter a valid email address.');
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                setError('Invalid email or password.');
                break;
            case 'auth/email-already-in-use':
                setError('An account with this email already exists. Please sign in.');
                break;
            default:
                setError('An error occurred. Please try again.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("A password reset link has been sent to your email address. Please check your inbox.");
    } catch (error: any) {
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        default:
          setError('An error occurred. Please try again.');
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isResettingPassword) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-sm p-8 space-y-8 bg-white shadow-lg rounded-xl">
          <div>
            <h1 className="text-3xl font-bold text-center text-indigo-600">InvQuo</h1>
            <p className="mt-2 text-sm text-center text-slate-600">Reset Your Password</p>
          </div>
          <form className="space-y-6" onSubmit={handlePasswordReset}>
            <p className="text-sm text-slate-600 text-center">Enter your email address and we'll send you a link to get back into your account.</p>
            <div>
              <label htmlFor="email-address-reset" className="sr-only">Email address</label>
              <input
                id="email-address-reset"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            {message && <p className="text-center text-sm text-green-600">{message}</p>}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-wait"
              >
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>
          </form>
          <p className="text-center text-sm text-slate-600">
            <button onClick={() => { setIsResettingPassword(false); setError(''); setMessage(''); }} className="font-medium text-indigo-600 hover:text-indigo-500">
              Back to Sign In
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-8 space-y-8 bg-white shadow-lg rounded-xl">
        <div>
          <h1 className="text-3xl font-bold text-center text-indigo-600">InvQuo</h1>
          <p className="mt-2 text-sm text-center text-slate-600">
            {isSignUp ? 'Create a new account' : 'Please sign in to continue'}
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleAuthAction}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div className="relative">
              <label htmlFor="password-input" className="sr-only">Password</label>
              <input
                id="password-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
               <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 z-20 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeSlashIcon /> : <ViewIcon />}
              </button>
            </div>
          </div>

          {!isSignUp && (
            <div className="text-right text-sm">
              <button
                type="button"
                onClick={() => { setIsResettingPassword(true); setError(''); setMessage(''); }}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-wait"
            >
              {isLoading ? (isSignUp ? 'Signing Up...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-slate-600">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="font-medium text-indigo-600 hover:text-indigo-500">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;