import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Users, BookOpen, Shield, ArrowRight, LogIn } from 'lucide-react';

import studentImg from '../assets/login/student.jpg';
import facultyImg from '../assets/login/teacher.jpg';
import adminImg from '../assets/login/admin.jpg';

type LoginPortal = 'student' | 'teacher' | 'admin' | null;

export const LoginPage: React.FC = () => {
  const [selectedPortal, setSelectedPortal] = useState<LoginPortal>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getBackgroundGradient = (portal: LoginPortal) => {
    switch(portal) {
      case 'student':
        return 'from-slate-900 via-blue-900 to-slate-800';
      case 'teacher':
        return 'from-slate-900 via-purple-900 to-slate-800';
      case 'admin':
        return 'from-slate-900 via-emerald-900 to-slate-800';
      default:
        return 'from-slate-900 via-slate-900 to-slate-800';
    }
  };

  const getTextGradient = (portal: LoginPortal) => {
    switch(portal) {
      case 'student':
        return 'from-blue-400 to-cyan-400';
      case 'teacher':
        return 'from-purple-400 to-pink-400';
      case 'admin':
        return 'from-emerald-400 to-teal-400';
      default:
        return 'from-blue-400 to-cyan-400';
    }
  };

  const getInputFocusRing = (portal: LoginPortal) => {
    switch(portal) {
      case 'student':
        return 'focus:border-blue-500 focus:ring-blue-500/20';
      case 'teacher':
        return 'focus:border-purple-500 focus:ring-purple-500/20';
      case 'admin':
        return 'focus:border-emerald-500 focus:ring-emerald-500/20';
      default:
        return 'focus:border-blue-500 focus:ring-blue-500/20';
    }
  };

  const getButtonGradient = (portal: LoginPortal) => {
    switch(portal) {
      case 'student':
        return 'from-blue-600 to-cyan-600';
      case 'teacher':
        return 'from-purple-600 to-pink-600';
      case 'admin':
        return 'from-emerald-600 to-teal-600';
      default:
        return 'from-blue-600 to-cyan-600';
    }
  };

  const getButtonShadow = (portal: LoginPortal) => {
    switch(portal) {
      case 'student':
        return 'hover:shadow-lg hover:shadow-blue-500/50';
      case 'teacher':
        return 'hover:shadow-lg hover:shadow-purple-500/50';
      case 'admin':
        return 'hover:shadow-lg hover:shadow-emerald-500/50';
      default:
        return 'hover:shadow-lg hover:shadow-blue-500/50';
    }
  };

  const portals = [
    {
      id: 'student' as LoginPortal,
      title: 'Student',
      subtitle: 'Access study materials & resources',
      icon: Users,
      bgImage: studentImg,
      gradient: 'from-blue-500 via-blue-600 to-blue-700',
      accentGradient: 'from-blue-400 to-cyan-500',
      darkGradient: 'dark:from-blue-900 dark:to-blue-950'
    },
    {
      id: 'teacher' as LoginPortal,
      title: 'Faculty',
      subtitle: 'Create & manage educational content',
      icon: BookOpen,
      bgImage: facultyImg,
      gradient: 'from-purple-500 via-purple-600 to-purple-700',
      accentGradient: 'from-purple-400 to-pink-500',
      darkGradient: 'dark:from-purple-900 dark:to-purple-950'
    },
    {
      id: 'admin' as LoginPortal,
      title: 'Admin',
      subtitle: 'System administration & oversight',
      icon: Shield,
      bgImage: adminImg,
      gradient: 'from-emerald-500 via-emerald-600 to-teal-700',
      accentGradient: 'from-emerald-400 to-teal-500',
      darkGradient: 'dark:from-emerald-900 dark:to-teal-950'
    },
  ];

  if (selectedPortal) {
    const portal = portals.find(p => p.id === selectedPortal);
    
    return (
      <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient(selectedPortal)} flex items-center justify-center px-4 py-8 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -ml-48 -mb-48"></div>
        
        <div className="max-w-md w-full space-y-6 relative z-10">
          <div className="text-center">
            <button
              onClick={() => {
                setSelectedPortal(null);
                setError('');
              }}
              className="mb-6 text-white/60 hover:text-white text-sm font-medium flex items-center gap-2 mx-auto transition"
            >
              ← Back to portal selection
            </button>

            <div className={`mx-auto h-16 w-16 bg-gradient-to-br ${portal?.accentGradient} rounded-xl flex items-center justify-center mb-4 shadow-2xl`}>
              <GraduationCap className="h-10 w-10 text-white" />
            </div>

            <h2 className={`text-3xl font-bold bg-gradient-to-r ${getTextGradient(selectedPortal)} bg-clip-text text-transparent mb-1`}>
              {portal?.title} Login
            </h2>
            <p className="text-white/60 text-sm">
              Integrated Study Resource Platform
            </p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-white/10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border-l-4 border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm animate-pulse">
                  {error}
                </div>
              )}

              {selectedPortal === 'student' ? (
                <div className="space-y-4">
                  <p className="text-white/60 text-center mb-6">
                    Sign in with Google to access student portal.
                  </p>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className={`w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r ${getButtonGradient(selectedPortal)} text-white rounded-xl ${getButtonShadow(selectedPortal)} disabled:opacity-50 transition font-medium group`}
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3 fill-white">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                        <ArrowRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`w-full px-4 py-3 bg-slate-700/50 border-2 border-white/10 rounded-xl text-white placeholder-white/40 transition ${getInputFocusRing(selectedPortal)}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 bg-slate-700/50 border-2 border-white/10 rounded-xl text-white placeholder-white/40 transition ${getInputFocusRing(selectedPortal)}`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r ${getButtonGradient(selectedPortal)} text-white rounded-xl ${getButtonShadow(selectedPortal)} disabled:opacity-50 transition font-semibold group`}
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5 mr-2" />
                        Sign In
                        <ArrowRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition" />
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>

      <div className="relative z-10 border-b border-white/10 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-xl shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center gap-4">
          <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">Ideal Institute of Technology</h1>
            <p className="text-sm text-white/60">Integrated Study Resource and Exam Preparation Platform</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-20 px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent mb-4">Select Your Portal</h2>
          <p className="text-white/60 text-lg">Choose your role to access your personalized learning experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <button
                key={portal.id}
                onClick={() => setSelectedPortal(portal.id)}
                className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 h-72 text-left"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${portal.bgImage})` }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                
                <div className={`absolute inset-0 bg-gradient-to-br ${portal.gradient} opacity-0 group-hover:opacity-30 transition duration-300`}></div>

                <div className="relative h-full flex flex-col justify-between p-8 text-white">
                  <div>
                    <div className={`inline-flex p-3 bg-gradient-to-br ${portal.accentGradient} rounded-xl shadow-lg mb-4 group-hover:scale-110 transition`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-3xl font-bold mb-2">{portal.title}</h3>
                    <p className="text-white/80 text-sm font-medium">{portal.subtitle}</p>
                    <div className="mt-4 flex items-center gap-2 text-white/60 group-hover:text-white transition">
                      <span className="text-sm font-medium">Get Started</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};
