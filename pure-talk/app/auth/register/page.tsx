// app/auth/register/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaEyeSlash, FaCheck, FaCamera, FaImage } from 'react-icons/fa';
import { Loader2, Mail, X, Heart } from 'lucide-react';
import { authAPI } from '@/lib/api';
import HeroVideo from '@/components/HeroVideo';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthday: string;
  gender: string;
  bio: string;
  mobile_number: string;
  country: string;
  city: string;
  profile_image: File | null;
  cover_image: File | null;
}

const STEP_LABELS = [
  { num: 1, title: 'Your Identity',   sub: 'Tell the community who you are' },
  { num: 2, title: 'Secure Account',  sub: 'Create a strong password' },
  { num: 3, title: 'Location Info',   sub: 'Where are you from?' },
  { num: 4, title: 'Profile Vibe',    sub: 'Photos make your profile shine' },
  { num: 5, title: "You're Ready!",   sub: 'Review and join the conversation' },
];

const Register: React.FC = () => {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    first_name: '', last_name: '', email: '',
    password: '', confirmPassword: '', birthday: '', gender: '', bio: '', 
    mobile_number: '', country: '', city: '',
    profile_image: null, cover_image: null,
  });

  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [coverPreview,   setCoverPreview]   = useState<string | null>(null);
  const [showPw,         setShowPw]         = useState(false);
  const [showCPw,        setShowCPw]        = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);
  const [agreed,         setAgreed]         = useState(false);
  const [step,           setStep]           = useState(1);
  const [apiError,       setApiError]       = useState('');
  const [successMsg,     setSuccessMsg]     = useState('');
  const [isGoogleLoad,   setIsGoogleLoad]   = useState(false);
  const [isAppleLoad,    setIsAppleLoad]    = useState(false);
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [fieldErrors,    setFieldErrors]    = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { 
        setApiError('File size must be less than 5MB');
        return; 
      }
      if (!['image/jpeg','image/jpg','image/png','image/gif','image/webp'].includes(file.type)) { 
        setApiError('Only JPG, PNG, GIF, or WEBP images are allowed');
        return; 
      }
      setFormData(f => ({ ...f, [name]: file }));
      const r = new FileReader();
      r.onloadend = () => {
        if (name === 'profile_image') setProfilePreview(r.result as string);
        else if (name === 'cover_image') setCoverPreview(r.result as string);
      };
      r.readAsDataURL(file);
    } else {
      setFormData(f => ({ ...f, [name]: value }));
    }
    if (apiError)   setApiError('');
    if (successMsg) setSuccessMsg('');
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.first_name || !formData.last_name || !formData.email)
        return setApiError('Please fill in all required fields');
      if (!/\S+@\S+\.\S+/.test(formData.email))
        return setApiError('Please enter a valid email address');
    } else if (step === 2) {
      if (!formData.password || !formData.confirmPassword)
        return setApiError('Please fill in both password fields');
      if (formData.password.length < 6)
        return setApiError('Password must be at least 6 characters');
      if (formData.password !== formData.confirmPassword)
        return setApiError('Passwords do not match');
    }
    setStep(s => s + 1);
    setApiError('');
  };

  const prevStep = () => {
    if (step > 1) { setStep(s => s - 1); setApiError(''); }
    else router.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return setApiError('You must agree to the Terms & Privacy Policy');
    setIsLoading(true); 
    setApiError(''); 
    setSuccessMsg('');
    setFieldErrors({});
    
    try {
      const fd = new FormData();
      
      const fullName = `${formData.first_name} ${formData.last_name}`.trim();
      fd.append('full_name', fullName);
      fd.append('email', formData.email);
      fd.append('password', formData.password);
      fd.append('confirm_password', formData.confirmPassword);
      
      if (formData.mobile_number && formData.mobile_number.trim()) {
        fd.append('mobile_number', formData.mobile_number);
      }
      if (formData.birthday && formData.birthday.trim()) {
        fd.append('birthday', formData.birthday);
      }
      if (formData.gender && formData.gender.trim()) {
        let genderValue = formData.gender;
        if (!['male', 'female', 'custom', 'prefer_not_to_say'].includes(genderValue)) {
          genderValue = 'prefer_not_to_say';
        }
        fd.append('gender', genderValue);
      }
      if (formData.country && formData.country.trim()) {
        fd.append('country', formData.country);
      }
      if (formData.city && formData.city.trim()) {
        fd.append('city', formData.city);
      }
      if (formData.bio && formData.bio.trim()) {
        fd.append('bio', formData.bio);
      }
      
      if (formData.profile_image) {
        fd.append('profile_picture', formData.profile_image);
      }
      
      if (formData.cover_image) {
        fd.append('cover_image', formData.cover_image);
      }

      const response = await authAPI.register(fd);
      
      setSuccessMsg('Profile created! Dropping you into your feed...');
      setTimeout(() => router.push('/home'), 2000);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        const errors: Record<string, string> = {};
        
        if (errorData.email) errors.email = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
        if (errorData.password) errors.password = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
        if (errorData.confirm_password) errors.confirmPassword = Array.isArray(errorData.confirm_password) ? errorData.confirm_password[0] : errorData.confirm_password;
        if (errorData.full_name) errors.first_name = Array.isArray(errorData.full_name) ? errorData.full_name[0] : errorData.full_name;
        if (errorData.birthday) errors.birthday = Array.isArray(errorData.birthday) ? errorData.birthday[0] : errorData.birthday;
        if (errorData.mobile_number) errors.mobile_number = Array.isArray(errorData.mobile_number) ? errorData.mobile_number[0] : errorData.mobile_number;
        if (errorData.gender) errors.gender = Array.isArray(errorData.gender) ? errorData.gender[0] : errorData.gender;
        if (errorData.country) errors.country = Array.isArray(errorData.country) ? errorData.country[0] : errorData.country;
        if (errorData.city) errors.city = Array.isArray(errorData.city) ? errorData.city[0] : errorData.city;
        if (errorData.bio) errors.bio = Array.isArray(errorData.bio) ? errorData.bio[0] : errorData.bio;
        if (errorData.profile_picture) errors.profile_image = Array.isArray(errorData.profile_picture) ? errorData.profile_picture[0] : errorData.profile_picture;
        if (errorData.cover_image) errors.cover_image = Array.isArray(errorData.cover_image) ? errorData.cover_image[0] : errorData.cover_image;
        
        if (errorData.non_field_errors) {
          setApiError(Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors);
        } else if (errorData.detail) {
          setApiError(typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail));
        } else if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          if (errors.email || errors.first_name || errors.full_name) setStep(1);
          else if (errors.password || errors.confirmPassword) setStep(2);
          else if (errors.mobile_number || errors.country || errors.city) setStep(3);
          else if (errors.profile_image || errors.cover_image || errors.bio) setStep(4);
        } else {
          setApiError(`Registration failed: ${JSON.stringify(errorData).substring(0, 200)}`);
        }
      } else if (error.message) {
        setApiError(error.message);
      } else {
        setApiError('Registration failed. Please check your information and try again.');
      }
    } finally { 
      setIsLoading(false); 
    }
  };

  const curStep = STEP_LABELS[step - 1];

  // Custom select component with portal-like rendering using fixed positioning
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const genderRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const openGenderDropdown = () => {
    if (genderRef.current) {
      const rect = genderRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
      setIsGenderOpen(true);
    }
  };

  const selectGender = (value: string) => {
    setFormData(f => ({ ...f, gender: value }));
    setIsGenderOpen(false);
    if (fieldErrors.gender) {
      setFieldErrors(prev => ({ ...prev, gender: '' }));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genderRef.current && !genderRef.current.contains(event.target as Node)) {
        setIsGenderOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-sans bg-[#111] text-white selection:bg-red-500 selection:text-white">
      {/* Hero Video background */}
      <HeroVideo />
      
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/65 z-10 pointer-events-none" />

      {/* Header matching landing page */}
      <header className="sticky top-0 z-50 p-6 mix-blend-difference border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl font-bold tracking-[0.15em] uppercase hover:opacity-70 transition-opacity">
            PURE TALK
          </Link>
          <nav className="hidden md:flex items-center gap-10 text-xs tracking-[0.24em] text-white/70 uppercase">
            <Link href="/home" className="hover:text-white transition-colors">Feed</Link>
            <Link href="/users/friends" className="hover:text-white transition-colors">Friends</Link>
            <Link href="/users/posts" className="hover:text-white transition-colors">Posts</Link>
            <Link href="/users/notifications" className="hover:text-white transition-colors">Notifications</Link>
          </nav>
          <Link
            href="/auth/login"
            className="inline-flex items-center rounded-full border border-white/30 px-6 py-2 text-xs tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Split layout */}
      <div className="relative z-20 flex flex-col lg:flex-row min-h-[calc(100vh-85px)] max-w-7xl mx-auto px-6 py-10">

        {/* LEFT — Branding */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-14 order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-md w-full"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold uppercase leading-tight tracking-tight mb-5">
              <span className="block text-white">Your story</span>
              <span className="block text-red-500">
                starts here.
              </span>
            </h1>

            <p className="text-base leading-relaxed font-light mb-8 max-w-sm text-white/70">
              Share moments, spark conversations, and build your tribe — a community where every voice is heard and every story matters.
            </p>

            <div className="space-y-4">
              {[
                { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, title: 'Find your people', sub: 'Follow interests, not algorithms' },
                { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, title: 'Post, share & react', sub: 'Stories, threads, photos & more' },
                { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, title: 'Safe & authentic', sub: 'AI keeps your feed toxicity-free' },
              ].map(({ icon, title, sub }) => (
                <div key={title} className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10 text-red-400">
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase">{title}</p>
                    <p className="text-xs text-white/50">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-5 border-t border-white/10 flex gap-7">
              {[['2M+','Members'],['180+','Countries'],['4.9★','Rated']].map(([v, l]) => (
                <div key={l}>
                  <p className="text-xl font-bold text-white tracking-tight">{v}</p>
                  <p className="text-xs mt-0.5 font-mono text-white/40 uppercase">{l}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-10 order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-[680px]"
          >
            <div className="backdrop-blur-2xl rounded-3xl relative overflow-visible border border-white/10 bg-[#1a1a1a]/80 shadow-2xl p-7">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 to-orange-500 rounded-t-3xl" />

              <div>

                {/* Progress - 5 steps */}
                <div className="flex justify-between items-center mb-6 pb-5 border-b border-white/10">
                  {[1,2,3,4,5].map((n) => (
                    <React.Fragment key={n}>
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-500 ${
                          step >= n
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                            : 'bg-black/40 text-gray-500 border border-white/10'
                        }`}
                      >
                        {step > n ? <FaCheck size={11} /> : n}
                      </div>
                      {n < 5 && (
                        <div className="flex-1 mx-1.5">
                          <div className={`h-0.5 rounded-full transition-all duration-500 ${step > n ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-white/10'}`} />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Step heading */}
                <div className="mb-5">
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-white">{curStep.title}</h2>
                  <p className="text-xs font-mono uppercase text-white/50 mt-0.5">{curStep.sub}</p>
                </div>

                {/* Alerts */}
                <AnimatePresence>
                  {apiError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 14 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="p-3 rounded-xl text-xs flex items-start gap-2 bg-red-500/20 border border-red-500/40 text-red-300"
                    >
                      <X size={14} className="shrink-0 mt-0.5 cursor-pointer text-red-400" onClick={() => setApiError('')} />
                      <p className="flex-1 break-words">{apiError}</p>
                    </motion.div>
                  )}
                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 14 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="p-3 rounded-xl text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-start gap-2"
                    >
                      <FaCheck size={12} className="shrink-0 mt-0.5" />
                      <p>{successMsg}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-4">

                  {/* STEP 1 — Identity */}
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5 text-white/60">First name *</label>
                          <input 
                            type="text" 
                            name="first_name" 
                            value={formData.first_name} 
                            onChange={handleChange} 
                            required 
                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent" 
                            placeholder="Jane" 
                          />
                          {fieldErrors.first_name && (
                            <p className="text-red-400 text-[10px] mt-1">{fieldErrors.first_name}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5 text-white/60">Last name *</label>
                          <input 
                            type="text" 
                            name="last_name" 
                            value={formData.last_name} 
                            onChange={handleChange} 
                            required 
                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent" 
                            placeholder="Doe" 
                          />
                          {fieldErrors.last_name && (
                            <p className="text-red-400 text-[10px] mt-1">{fieldErrors.last_name}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5 text-white/60">Email address *</label>
                        <input 
                          type="email" 
                          name="email" 
                          value={formData.email} 
                          onChange={handleChange} 
                          required 
                          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent" 
                          placeholder="jane@example.com" 
                        />
                        {fieldErrors.email ? (
                          <p className="text-red-400 text-[10px] mt-1">{fieldErrors.email}</p>
                        ) : (
                          <p className="text-[11px] mt-1 text-white/40 font-mono">We&apos;ll never share your email.</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5 text-white/60">Birthday</label>
                          <input 
                            type="date" 
                            name="birthday" 
                            value={formData.birthday} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent [color-scheme:dark]" 
                          />
                          {fieldErrors.birthday && (
                            <p className="text-red-400 text-[10px] mt-1">{fieldErrors.birthday}</p>
                          )}
                        </div>
                        <div className="relative" ref={genderRef}>
                          <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5 text-white/60">Gender</label>
                          <div 
                            onClick={openGenderDropdown}
                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent cursor-pointer flex justify-between items-center"
                          >
                            <span className={!formData.gender ? 'text-white/30' : ''}>
                              {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1).replace(/_/g, ' ') : 'Select'}
                            </span>
                            <svg className={`fill-current h-3.5 w-3.5 transition-transform duration-200 ${isGenderOpen ? 'rotate-180' : ''} text-white/50`} viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                          </div>
                          {fieldErrors.gender && (
                            <p className="text-red-400 text-[10px] mt-1">{fieldErrors.gender}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2 — Password */}
                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5 text-white/60">Password *</label>
                        <div className="relative">
                          <input 
                            type={showPw ? 'text' : 'password'} 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                            minLength={6} 
                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent pr-11" 
                            placeholder="Min 6 characters" 
                          />
                          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors text-white/50 hover:text-white">
                            {showPw ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                          </button>
                        </div>
                        {fieldErrors.password && (
                          <p className="text-red-400 text-[10px] mt-1">{fieldErrors.password}</p>
                        )}
                        {formData.password && !fieldErrors.password && (
                          <div className="flex gap-1.5 mt-2">
                            {[1,2,3,4].map(i => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                formData.password.length >= i * 3
                                  ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-orange-400' : i <= 3 ? 'bg-yellow-400' : 'bg-emerald-500'
                                  : 'bg-white/10'
                              }`} />
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5 text-white/60">Confirm password *</label>
                        <div className="relative">
                          <input 
                            type={showCPw ? 'text' : 'password'} 
                            name="confirmPassword" 
                            value={formData.confirmPassword} 
                            onChange={handleChange} 
                            required 
                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent pr-11" 
                            placeholder="Repeat password" 
                          />
                          <button type="button" onClick={() => setShowCPw(!showCPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors text-white/50 hover:text-white">
                            {showCPw ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                          </button>
                        </div>
                        {fieldErrors.confirmPassword && (
                          <p className="text-red-400 text-[10px] mt-1">{fieldErrors.confirmPassword}</p>
                        )}
                        {formData.confirmPassword && !fieldErrors.confirmPassword && (
                          <p className={`text-[11px] mt-1.5 flex items-center gap-1 font-mono ${formData.password === formData.confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formData.password === formData.confirmPassword ? <FaCheck size={10} /> : <X size={10} />}
                            {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                          </p>
                        )}
                      </div>

                      <div className="p-4 rounded-2xl flex gap-3 items-start bg-white/5 border border-white/10">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-red-500/20 text-red-400">
                          <Heart className="w-3.5 h-3.5" fill="currentColor" />
                        </div>
                        <div className="text-xs text-white/60">
                          <p className="font-mono uppercase font-bold mb-0.5 text-white">Protect your account</p>
                          <p>Mix letters, numbers, and symbols. Never share your password with anyone.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3 — Location Info */}
                  {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5 text-white/60">Mobile Number (optional)</label>
                        <input 
                          type="tel" 
                          name="mobile_number" 
                          value={formData.mobile_number} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent" 
                          placeholder="+1 234 567 8900" 
                        />
                        {fieldErrors.mobile_number && (
                          <p className="text-red-400 text-[10px] mt-1">{fieldErrors.mobile_number}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5 text-white/60">Country (optional)</label>
                        <input 
                          type="text" 
                          name="country" 
                          value={formData.country} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent" 
                          placeholder="United States" 
                        />
                        {fieldErrors.country && (
                          <p className="text-red-400 text-[10px] mt-1">{fieldErrors.country}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5 text-white/60">City (optional)</label>
                        <input 
                          type="text" 
                          name="city" 
                          value={formData.city} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent" 
                          placeholder="New York" 
                        />
                        {fieldErrors.city && (
                          <p className="text-red-400 text-[10px] mt-1">{fieldErrors.city}</p>
                        )}
                      </div>

                      <div className="p-4 rounded-2xl flex gap-3 items-start bg-white/5 border border-white/10">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-white/10">
                          <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="text-xs text-white/60">
                          <p className="font-mono uppercase font-bold mb-0.5 text-white">Location helps personalize your experience</p>
                          <p>Your location is never shared publicly without your permission.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4 — Photos + Bio */}
                  {step === 4 && (
                    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider mb-2 text-white/60">Profile photo</label>
                        <div className="flex items-center gap-4">
                          <div className="relative group flex-shrink-0">
                            {profilePreview ? (
                              <img src={profilePreview} alt="Profile" className="w-[72px] h-[72px] rounded-full object-cover border-2 border-red-500 shadow-lg" />
                            ) : (
                              <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-black/40 border border-white/20">
                                <FaCamera className="text-white/40" size={22} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs mb-2 text-white/50">Your profile photo appears on your posts, comments, and profile page.</p>
                            <label className="cursor-pointer inline-block">
                              <input type="file" name="profile_image" accept="image/*" onChange={handleChange} className="hidden" />
                              <span className="px-5 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all bg-white/10 hover:bg-white/20 text-white border border-white/20">
                                {profilePreview ? 'Change photo' : 'Upload photo'}
                              </span>
                            </label>
                          </div>
                        </div>
                        {fieldErrors.profile_image && (
                          <p className="text-red-400 text-[10px] mt-1">{fieldErrors.profile_image}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider mb-2 text-white/60">Cover photo</label>
                        {coverPreview ? (
                          <div className="relative group overflow-hidden rounded-2xl border border-white/20 h-24 mb-2">
                            <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div
                            className="h-20 w-full rounded-2xl flex flex-col items-center justify-center border border-dashed transition-colors cursor-pointer mb-2 bg-black/40 border-white/20 hover:bg-white/5"
                            onClick={() => document.getElementById('cover-input')?.click()}
                          >
                            <FaImage className="text-white/30" size={22} />
                            <span className="text-xs font-mono uppercase mt-1.5 text-white/40">Add a cover photo for your profile</span>
                          </div>
                        )}
                        <label className="cursor-pointer block w-full">
                          <input id="cover-input" type="file" name="cover_image" accept="image/*" onChange={handleChange} className="hidden" />
                          <span className="block w-full text-center px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all bg-white/10 hover:bg-white/20 text-white border border-white/20">
                            {coverPreview ? 'Change cover' : 'Upload cover'}
                          </span>
                        </label>
                        {fieldErrors.cover_image && (
                          <p className="text-red-400 text-[10px] mt-1">{fieldErrors.cover_image}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5 text-white/60">
                          Bio <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          maxLength={150}
                          rows={2}
                          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent resize-none"
                          placeholder="Tell your community a little about yourself…"
                        />
                        {fieldErrors.bio && (
                          <p className="text-red-400 text-[10px] mt-1">{fieldErrors.bio}</p>
                        )}
                        <p className="text-[11px] mt-1 text-right text-white/40 font-mono">{formData.bio.length}/150</p>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 5 — Review */}
                  {step === 5 && (
                    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                          {profilePreview
                            ? <img src={profilePreview} alt="" className="w-11 h-11 rounded-full object-cover border border-red-500" />
                            : <div className="w-11 h-11 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-base">
                                {formData.first_name[0]?.toUpperCase()}
                              </div>
                          }
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate uppercase text-white">{formData.first_name} {formData.last_name}</p>
                            <p className="text-xs font-mono text-red-400">{formData.email}</p>
                            {formData.bio && <p className="text-xs mt-0.5 line-clamp-1 text-white/50">{formData.bio}</p>}
                          </div>
                        </div>
                        <div className="space-y-1.5 text-xs border-t pt-3 border-white/10 font-mono">
                          {[
                            ['Email', formData.email],
                            ...(formData.mobile_number ? [['Mobile', formData.mobile_number]] : []),
                            ...(formData.country ? [['Country', formData.country]] : []),
                            ...(formData.city ? [['City', formData.city]] : []),
                            ...(formData.birthday ? [['Birthday', formData.birthday]] : []),
                            ...(formData.gender ? [['Gender', formData.gender]] : []),
                            ...(profilePreview ? [['Profile Photo', 'Uploaded']] : []),
                            ...(coverPreview ? [['Cover Photo', 'Uploaded']] : []),
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-4">
                              <span className="flex-shrink-0 text-white/40 uppercase">{k}</span>
                              <span className="font-medium capitalize truncate text-white">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                            <input
                              type="checkbox"
                              checked={agreed}
                              onChange={(e) => setAgreed(e.target.checked)}
                              style={{ accentColor: '#ef4444' }}
                              className="w-4 h-4 rounded cursor-pointer"
                            />
                          </div>
                          <span className="text-xs leading-relaxed text-white/70">
                            I agree to PureTalk&apos;s{' '}
                            <Link href="/terms" className="font-bold text-red-400 hover:text-red-300 transition-colors">Terms of Service</Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="font-bold text-red-400 hover:text-red-300 transition-colors">Privacy Policy</Link>.
                            I&apos;ll keep my conversations real and respectful.
                          </span>
                        </label>
                      </div>

                      <p className="text-xs flex items-center gap-2 px-1 text-white/50 font-mono uppercase">
                        <Heart className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="currentColor" />
                        After joining you can customise your feed, follow people, and post your first story.
                      </p>
                    </motion.div>
                  )}

                  {/* Nav buttons */}
                  <div className="flex gap-3 pt-2">
                    {step > 1 && (
                      <button type="button" onClick={prevStep} disabled={isLoading}
                        className="py-3 px-6 rounded-full text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50 hidden sm:block bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3.5 rounded-full text-xs font-mono uppercase tracking-widest font-bold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg"
                    >
                      {isLoading
                        ? <><Loader2 className="animate-spin" size={17} />{step === 5 ? 'Creating profile…' : 'Saving…'}</>
                        : step === 5 ? 'Join PureTalk' : 'Continue →'
                      }
                    </button>
                  </div>
                </form>

                {/* Social signup */}
                {step === 1 && (
                  <>
                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-[11px] font-mono uppercase tracking-widest">
                        <span className="px-4 bg-[#1a1a1a] text-white/40">or join with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => { setIsGoogleLoad(true); setTimeout(() => { alert('Google OAuth integration coming soon'); setIsGoogleLoad(false); }, 1500); }}
                        disabled={isGoogleLoad || isLoading}
                        className="py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all bg-white hover:bg-gray-100 text-black text-xs font-mono uppercase tracking-wider font-bold disabled:opacity-50"
                      >
                        {isGoogleLoad ? <Loader2 className="animate-spin" size={17} /> : (
                          <>
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span>Google</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => { setIsAppleLoad(true); setTimeout(() => { alert('Apple OAuth integration coming soon'); setIsAppleLoad(false); }, 1500); }}
                        disabled={isAppleLoad || isLoading}
                        className="py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-mono uppercase tracking-wider font-bold disabled:opacity-50 bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                      >
                        {isAppleLoad ? <Loader2 className="animate-spin" size={17} /> : (
                          <>
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#FFFFFF">
                              <path d="M16.365 11.773c0-2.118 1.724-3.139 1.804-3.19-.982-1.438-2.54-1.635-3.091-1.657-1.316-.133-2.568.775-3.236.775-.668 0-1.702-.756-2.796-.736-1.44.02-2.767.837-3.509 2.127-1.498 2.597-.383 6.445 1.075 8.55.714 1.032 1.565 2.19 2.683 2.148 1.076-.042 1.484-.697 2.786-.697 1.302 0 1.674.697 2.808.674 1.159-.02 1.893-1.051 2.598-2.087.82-1.205 1.157-2.372 1.178-2.434-.025-.012-2.26-.868-2.282-3.443zM14.239 5.734c.591-.718.99-1.717.881-2.71-.853.034-1.887.569-2.5 1.286-.55.637-1.031 1.656-.902 2.633.955.074 1.93-.483 2.521-1.209z"/>
                            </svg>
                            <span>Apple</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* Sign in link */}
                <p className="text-center text-xs font-mono uppercase mt-6 text-white/50">
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className="font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    Sign in instead
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Gender Dropdown */}
      <AnimatePresence>
        {isGenderOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 9999,
            }}
            className="rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl border border-white/15 bg-[#1a1a1a]/95 text-white"
          >
            <div className="py-1">
              {['male', 'female', 'custom', 'prefer_not_to_say'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectGender(option)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-mono uppercase transition-colors ${
                    formData.gender === option
                      ? 'bg-red-500/20 text-red-400'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} className="fixed inset-0 backdrop-blur-md z-50 bg-black/80" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md rounded-3xl shadow-2xl overflow-hidden bg-[#1a1a1a] border border-white/10 text-white"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h3 className="text-base font-bold uppercase tracking-tight flex items-center gap-2">
                  <Mail className="text-red-400 w-4 h-4" /> Need Help?
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="transition text-white/50 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-center mb-4 text-xs font-mono uppercase text-white/60">Trouble signing up? Our team is here for you.</p>
                <button onClick={() => (window.location.href = 'mailto:support@puretalk.com')}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-mono uppercase tracking-widest font-bold transition-all shadow-lg"
                >
                  Email Support Team
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');
        * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
      `}</style>
    </div>
  );
};

export default Register;