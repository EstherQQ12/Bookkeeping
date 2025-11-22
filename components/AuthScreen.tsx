
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { UserCircle2, Mail, Calendar, ShieldCheck, AlertCircle, Hash, Phone, Lock } from 'lucide-react';
import { registerUser, loginUser } from '../services/store';
import { isFirebaseConfigured } from '../services/firebase';

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Added email for Online login
  const [password, setPassword] = useState('');
  const [ageInput, setAgeInput] = useState('');
  
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [reportFrequency, setReportFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // -- LOGIN LOGIC --
    if (isLoginMode) {
        if (!password) { setErrors({password: "Required"}); return; }
        // Use email if online, else name is loosely allowed offline
        if (isFirebaseConfigured && !email) { setErrors({email: "Email required for online login"}); return; }
        if (!isFirebaseConfigured && !name) { setErrors({name: "Name required"}); return; }

        setIsLoading(true);
        try {
            const identifier = isFirebaseConfigured ? email : name;
            const user = await loginUser(identifier, password);
            onLogin(user);
        } catch (err: any) {
            setErrors({ form: "Invalid credentials. Please try again." });
        } finally {
            setIsLoading(false);
        }
        return;
    }

    // -- REGISTER LOGIC --
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = "Name is required";
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    const ageNum = parseInt(ageInput);

    if (!ageInput) {
      newErrors.age = "Age is required";
    } else if (isNaN(ageNum) || ageNum < 5 || ageNum > 100) {
      newErrors.age = "Please enter a valid age";
    }

    // Guardian Validation for 17 and under
    const isUnderage = !isNaN(ageNum) && ageNum <= 17;
    
    if (isUnderage) {
      const hasEmail = guardianEmail.trim().length > 0;
      const hasPhone = guardianPhone.trim().length > 0;

      if (!hasEmail && !hasPhone) {
        newErrors.guardianSection = "Please provide either an email or phone number.";
      }

      if (hasEmail && !emailRegex.test(guardianEmail)) {
        newErrors.guardianEmail = "Please enter a valid email.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    // Generate 8-digit random ID
    const displayId = Math.floor(10000000 + Math.random() * 90000000).toString();

    const userProfile: UserProfile = {
      name,
      displayId,
      password, // Note: In a real production app, never store plain text passwords in types/state
      age: ageNum,
      guardianEmail: isUnderage && guardianEmail ? guardianEmail : undefined,
      guardianPhone: isUnderage && guardianPhone ? guardianPhone : undefined,
      reportFrequency: isUnderage ? reportFrequency : undefined,
    };

    try {
        await registerUser(userProfile);
        if (isUnderage) {
            alert(`ℹ️ Guardian notification simulated.`);
        }
        onLogin(userProfile);
    } catch (err: any) {
        setErrors({ form: "Error creating account: " + err.message });
    } finally {
        setIsLoading(false);
    }
  };

  const ageNum = parseInt(ageInput);
  const isUnderage = !isNaN(ageNum) && ageNum <= 17 && ageInput !== '';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="bg-slate-900 p-8 text-center text-white">
          <div className="mx-auto bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <UserCircle2 size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-slate-400 text-sm">
            {isLoginMode ? 'Log in to your bookkeeping profile' : 'Setup your bookkeeping profile'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {errors.form && <div className="p-3 bg-rose-100 text-rose-600 rounded-xl text-sm text-center">{errors.form}</div>}
          
          {/* Login Email Field (Only Online) */}
          {isLoginMode && isFirebaseConfigured && (
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none"
                  placeholder="your@email.com"
                />
             </div>
          )}

          {/* Name Field (Register OR Offline Login) */}
          {(!isLoginMode || !isFirebaseConfigured) && (
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                    {isLoginMode ? 'Full Name (Offline Login)' : 'Full Name'}
                </label>
                <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                placeholder="e.g. Alex Tan"
                />
                {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
            </div>
          )}

          {/* Password Field */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 p-3 rounded-xl bg-slate-50 border focus:ring-2 focus:ring-slate-900 outline-none transition-all ${errors.password ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}
                  placeholder="••••••••"
                />
            </div>
            {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Registration Fields */}
          {!isLoginMode && (
            <>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Age</label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                        type="number"
                        value={ageInput}
                        onChange={(e) => setAgeInput(e.target.value)}
                        className="w-full pl-10 p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-700"
                        placeholder="e.g. 16"
                        min="5"
                        max="99"
                        />
                    </div>
                    {errors.age && <p className="text-rose-500 text-xs mt-1">{errors.age}</p>}
                    
                    {isUnderage && !errors.age && (
                    <div className="mt-2 text-xs font-medium flex items-center gap-1.5 text-amber-600 animate-in fade-in">
                        <AlertCircle size={14}/>
                        Guardian supervision required.
                    </div>
                    )}
                </div>

                {isUnderage && (
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm border-b border-amber-200 pb-2">
                        <ShieldCheck size={16} />
                        Guardian Info
                    </div>
                    
                    {errors.guardianSection && (
                        <div className="p-3 bg-rose-100 border border-rose-200 rounded-xl text-rose-600 text-xs font-medium">
                        {errors.guardianSection}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Guardian's Email</label>
                        <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="email"
                            value={guardianEmail}
                            onChange={(e) => setGuardianEmail(e.target.value)}
                            className={`w-full pl-10 p-3 rounded-xl bg-white border focus:ring-2 focus:ring-amber-500 outline-none ${errors.guardianEmail ? 'border-rose-300' : 'border-amber-200'}`}
                            placeholder="parent@example.com"
                        />
                        </div>
                        {errors.guardianEmail && <p className="text-rose-500 text-xs mt-1">{errors.guardianEmail}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Guardian's Phone</label>
                        <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="tel"
                            value={guardianPhone}
                            onChange={(e) => setGuardianPhone(e.target.value)}
                            className="w-full pl-10 p-3 rounded-xl bg-white border border-amber-200 focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="+60 12-345 6789"
                        />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Report Frequency</label>
                        <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setReportFrequency('weekly')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                            reportFrequency === 'weekly' 
                                ? 'bg-amber-500 text-white shadow-md' 
                                : 'bg-white text-slate-600 border border-amber-200'
                            }`}
                        >
                            <Calendar size={14} /> Weekly
                        </button>
                        <button
                            type="button"
                            onClick={() => setReportFrequency('monthly')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                            reportFrequency === 'monthly' 
                                ? 'bg-amber-500 text-white shadow-md' 
                                : 'bg-white text-slate-600 border border-amber-200'
                            }`}
                        >
                            <Calendar size={14} /> Monthly
                        </button>
                        </div>
                    </div>
                    </div>
                )}
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98] mt-4 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : (isLoginMode ? 'Login' : 'Confirm & Create Account')}
          </button>

          <div className="text-center">
            <button 
                type="button" 
                onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setErrors({});
                }} 
                className="text-sm text-slate-500 font-semibold hover:text-slate-800"
            >
                {isLoginMode ? "New here? Create Account" : "Already have an account? Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
