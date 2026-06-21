'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  Volume2, VolumeX, Moon, Sun, Clock, Calendar, 
  MapPin, Heart, Share2, ChevronLeft, ChevronRight, 
  X, Check, AlertCircle, Sparkles, Navigation
} from 'lucide-react';
import { submitRSVP } from './actions';

// Main client wrapper that suspends to prevent build issues
export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center font-serif text-terracotta-600 text-xl animate-pulse">
          Loading invitation...
        </div>
      </div>
    }>
      <InvitationApp />
    </Suspense>
  );
}

function InvitationApp() {
  const searchParams = useSearchParams();
  const guestNameParam = searchParams.get('to') || '';

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Wax seal state
  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(false);
  const [isEnvelopeHidden, setIsEnvelopeHidden] = useState(false);

  // Invitation Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const invitationCards = [
    '/images/card-1.webp',
    '/images/card-2.webp',
    '/images/card-3.webp',
    '/images/card-4.webp',
    '/images/card-5.webp',
    '/images/card-6.webp',
    '/images/card-7.webp',
    '/images/card-8.webp',
  ];

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: false
  });

  // RSVP Form state
  const [rsvpForm, setRsvpForm] = useState({
    guestName: guestNameParam,
    phoneNumber: '',
    attendanceStatus: 'attending' as 'attending' | 'declined',
    adultsCount: 1,
    childrenCount: 0,
    vegCount: 1,
    nonvegCount: 0,
    receptionAttendance: true,
    parkingRequired: false,
    specialMessage: ''
  });

  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  // Initialize Theme and Audio
  useEffect(() => {
    // Check local storage for theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Audio setup
    // Soft romantic piano piece
    audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Sync guest name from search param if it exists and form is empty
  useEffect(() => {
    if (guestNameParam) {
      setRsvpForm(prev => ({ ...prev, guestName: guestNameParam }));
    }
  }, [guestNameParam]);

  // Toggle Theme
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Toggle Music
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.warn('Audio play blocked by browser autoplay restriction', err);
      });
      setIsPlaying(true);
    }
  };

  // Handle opening envelope
  const handleOpenEnvelope = () => {
    setIsEnvelopeOpened(true);
    // Play music when opening the envelope (natural user interaction bypasses autoplay block)
    if (audioRef.current && !isPlaying) {
      audioRef.current.play().catch(e => console.log('Audio error:', e));
      setIsPlaying(true);
    }
    // Fade out and hide envelope after animation
    setTimeout(() => {
      setIsEnvelopeHidden(true);
    }, 1200);
  };

  // Countdown timer logic (Target: July 25th, 2026 11:00 AM Nikah)
  useEffect(() => {
    const targetDate = new Date('2026-07-25T11:00:00+05:30').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft(prev => ({ ...prev, ended: true }));
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, ended: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Slider handlers
  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev === invitationCards.length - 1 ? 0 : prev + 1));
  };

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? invitationCards.length - 1 : prev - 1));
  };

  // Form input handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setRsvpForm(prev => ({ ...prev, name: checked }));
    } else if (type === 'number') {
      setRsvpForm(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setRsvpForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const setCheckboxVal = (name: string, checked: boolean) => {
    setRsvpForm(prev => ({ ...prev, [name]: checked }));
  };

  const setAttendance = (status: 'attending' | 'declined') => {
    setRsvpForm(prev => ({ ...prev, attendanceStatus: status }));
  };

  const adjustNumber = (name: string, delta: number, min: number = 0) => {
    setRsvpForm(prev => {
      const current = prev[name as keyof typeof prev] as number;
      const nextVal = Math.max(min, current + delta);
      
      // Auto adjust food options to keep matching total if attendance
      let updates: any = { [name]: nextVal };
      if (name === 'adultsCount' || name === 'childrenCount') {
        const nextAdults = name === 'adultsCount' ? nextVal : prev.adultsCount;
        const nextChildren = name === 'childrenCount' ? nextVal : prev.childrenCount;
        const nextTotal = nextAdults + nextChildren;
        
        updates.vegCount = Math.max(0, prev.vegCount);
        updates.nonvegCount = Math.max(0, nextTotal - updates.vegCount);
      }
      return { ...prev, ...updates };
    });
  };

  // RSVP Validation
  const validateForm = () => {
    if (!rsvpForm.guestName.trim()) {
      return 'Please enter your full name.';
    }
    if (!rsvpForm.phoneNumber.trim()) {
      return 'Please enter your mobile phone number.';
    }
    // Basic phone pattern check
    const phoneClean = rsvpForm.phoneNumber.replace(/\s+/g, '');
    if (phoneClean.length < 8) {
      return 'Please enter a valid mobile number.';
    }

    if (rsvpForm.attendanceStatus === 'attending') {
      const totalMembers = rsvpForm.adultsCount + rsvpForm.childrenCount;
      if (totalMembers <= 0) {
        return 'Please specify at least 1 adult or child attending.';
      }
      
      const totalMeals = rsvpForm.vegCount + rsvpForm.nonvegCount;
      if (totalMeals !== totalMembers) {
        return `The sum of Vegetarian (${rsvpForm.vegCount}) and Non-Vegetarian (${rsvpForm.nonvegCount}) meals must equal the total number of guests (${totalMembers}).`;
      }
    }

    return null;
  };

  // Submit RSVP Form
  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors(null);

    const error = validateForm();
    if (error) {
      setFormErrors(error);
      const element = document.getElementById('rsvp-section');
      element?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    const result = await submitRSVP(rsvpForm);

    setIsSubmitting(false);
    if (result.success) {
      setSubmitStatus('success');
      setSuccessMessage(result.message || 'Thank you for confirming your attendance!');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 8000);
    } else {
      setSubmitStatus('error');
      setFormErrors(result.error || 'Failed to submit RSVP. Please try again.');
    }
  };

  // Share invitation URL
  const handleShareInvite = () => {
    const inviteUrl = window.location.href;
    const shareText = `You are cordially invited to the wedding of Zainul Fouz and Zuhair on Saturday, July 25, 2026. View the invitation details and confirm your attendance here:\n${inviteUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Zainul & Zuhair Wedding Invitation',
        text: shareText,
        url: inviteUrl,
      }).catch(err => console.log('Share canceled', err));
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Invitation link and details copied to clipboard!');
      });
    }
  };

  const totalMembers = rsvpForm.adultsCount + rsvpForm.childrenCount;

  return (
    <div className="min-h-screen font-sans selection:bg-terracotta-100 selection:text-terracotta-700 bg-cream text-foreground transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100 pb-16">
      
      {/* 1. Envelope Welcome Overlay with Wax Seal */}
      {!isEnvelopeHidden && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-cream dark:bg-zinc-950 p-4 transition-all duration-1000 ease-in-out ${isEnvelopeOpened ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'}`}>
          <div className="max-w-lg w-full bg-[#fbf9f4] dark:bg-zinc-900 border border-beige dark:border-zinc-800 rounded-lg shadow-2xl p-8 md:p-12 text-center relative overflow-hidden flex flex-col justify-between min-h-[480px]">
            {/* Watermark leaf details */}
            <div className="absolute top-0 right-0 w-24 h-24 opacity-15 pointer-events-none text-olive-500">
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full transform scale-x-[-1]"><path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L7.58,17.26C9,17.9 10.5,18.5 12,18.5C17.5,18.5 20,13.5 20,8H17M12,16.5C10,16.5 8,15.5 6.5,14C7.5,11.5 9,9.5 11,8C10,10.5 10.5,13.5 12,16.5M16,6A2,2 0 0,1 14,8C14,6 12,4 12,4C12,4 16,4 16,6Z" /></svg>
            </div>
            <div className="absolute bottom-0 left-0 w-24 h-24 opacity-15 pointer-events-none text-olive-500">
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L7.58,17.26C9,17.9 10.5,18.5 12,18.5C17.5,18.5 20,13.5 20,8H17M12,16.5C10,16.5 8,15.5 6.5,14C7.5,11.5 9,9.5 11,8C10,10.5 10.5,13.5 12,16.5M16,6A2,2 0 0,1 14,8C14,6 12,4 12,4C12,4 16,4 16,6Z" /></svg>
            </div>

            <div className="my-auto space-y-6">
              <div className="w-20 h-20 mx-auto relative rounded-full border border-gold-500/30 flex items-center justify-center bg-cream/50 dark:bg-zinc-800">
                <Image src="/images/monogram.webp" alt="Z&Z" width={64} height={64} className="opacity-90 dark:brightness-110" priority />
              </div>
              
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.25em] text-olive-500 font-semibold">The Wedding Invitation of</p>
                <h2 className="text-3xl md:text-4xl font-serif text-terracotta-600 dark:text-terracotta-500">Zainul Fouz & Zuhair</h2>
              </div>

              {guestNameParam && (
                <div className="py-4 border-t border-b border-beige/60 dark:border-zinc-800/60 max-w-xs mx-auto">
                  <p className="text-sm italic text-gray-500 dark:text-zinc-400">Especially invited for</p>
                  <p className="text-xl font-serif text-olive-600 dark:text-olive-400 font-semibold mt-1">{guestNameParam}</p>
                </div>
              )}
            </div>

            <div className="mt-8 mb-4 space-y-4">
              <p className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Click the wax seal to open</p>
              
              {/* Animated Wax Seal Button */}
              <button 
                onClick={handleOpenEnvelope}
                className="w-16 h-16 mx-auto rounded-full bg-red-800 hover:bg-red-700 active:scale-95 shadow-lg border-2 border-red-950 flex items-center justify-center transition-all duration-300 transform cursor-pointer relative group"
                style={{ boxShadow: '0 6px 12px rgba(153, 27, 27, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)' }}
              >
                <span className="text-white font-serif font-bold text-lg select-none group-hover:scale-110 transition-transform">Z&Z</span>
                {/* Wax seal outer rim design */}
                <div className="absolute inset-1 rounded-full border border-red-900/40 pointer-events-none"></div>
                {/* Ripples around wax seal */}
                <span className="absolute -inset-2 rounded-full border border-red-800/20 animate-ping opacity-60 pointer-events-none group-hover:animate-none"></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {/* Background Music Toggle */}
        <button 
          onClick={toggleMusic}
          title="Play/Pause Background Music"
          className="p-3 bg-white dark:bg-zinc-800 text-terracotta-500 dark:text-terracotta-500 rounded-full shadow-lg border border-beige dark:border-zinc-700 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          {isPlaying ? (
            <div className="relative">
              <Volume2 size={20} className="animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            </div>
          ) : (
            <VolumeX size={20} />
          )}
        </button>

        {/* Theme Switcher Toggle */}
        <button 
          onClick={toggleTheme}
          title="Toggle Light/Dark Theme"
          className="p-3 bg-white dark:bg-zinc-800 text-olive-500 dark:text-olive-400 rounded-full shadow-lg border border-beige dark:border-zinc-700 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Share Button */}
        <button 
          onClick={handleShareInvite}
          title="Share Invitation"
          className="p-3 bg-terracotta-500 text-white rounded-full shadow-lg hover:bg-terracotta-600 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:py-32 flex flex-col items-center text-center px-4">
        {/* Monogram logo */}
        <div className="w-24 h-24 relative mb-6 animate-fade-in">
          <Image 
            src="/images/monogram.webp" 
            alt="Zainul & Zuhair Monogram" 
            width={96} 
            height={96} 
            className="opacity-90 dark:brightness-115 mx-auto"
          />
        </div>

        <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-olive-500 font-semibold mb-3">Save the Date</p>
        <h1 className="text-4xl md:text-6xl font-serif text-terracotta-600 dark:text-terracotta-500 mb-6 font-bold leading-tight">
          Zainul Fouz <br className="sm:hidden" />
          <span className="font-serif italic font-normal text-olive-500 dark:text-olive-400 font-serif text-3xl md:text-5xl mx-2">&amp;</span> <br className="sm:hidden" />
          Zuhair
        </h1>
        
        <p className="text-lg md:text-xl font-serif text-gray-600 dark:text-zinc-300 italic max-w-md mx-auto mb-10">
          Together with our beloved families, we invite you to celebrate our union.
        </p>

        {/* Countdown Timer */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-md w-full bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-beige dark:border-zinc-800 p-4 md:p-6 rounded-2xl shadow-xl mb-12">
          {!timeLeft.ended ? (
            <>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-semibold text-terracotta-600 dark:text-terracotta-500">{timeLeft.days}</div>
                <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 dark:text-zinc-400 mt-1">Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-semibold text-terracotta-600 dark:text-terracotta-500">{timeLeft.hours}</div>
                <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 dark:text-zinc-400 mt-1">Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-semibold text-terracotta-600 dark:text-terracotta-500">{timeLeft.minutes}</div>
                <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 dark:text-zinc-400 mt-1">Mins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-semibold text-terracotta-600 dark:text-terracotta-500">{timeLeft.seconds}</div>
                <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 dark:text-zinc-400 mt-1">Secs</div>
              </div>
            </>
          ) : (
            <div className="col-span-4 py-2 text-center text-xl font-serif text-olive-600 dark:text-olive-400 animate-pulse font-semibold">
              ✨ Just Married! Alhamdullilah ✨
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <a 
            href="#rsvp-section"
            className="px-8 py-3.5 bg-terracotta-500 text-white font-medium rounded-full shadow-lg hover:bg-terracotta-600 hover:shadow-terracotta-500/20 active:scale-98 transition-all"
          >
            Confirm Attendance
          </a>
          <a 
            href="#events-section"
            className="px-8 py-3.5 bg-white dark:bg-zinc-800 text-olive-600 dark:text-olive-400 border border-beige dark:border-zinc-700 font-medium rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-zinc-700/80 transition-all"
          >
            Wedding Details
          </a>
        </div>
      </section>

      {/* 3. Invitation Cards Slider */}
      <section className="bg-[#f5efe0]/30 dark:bg-zinc-900/30 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-serif text-olive-600 dark:text-olive-400 mb-2">Digital Invitation Card</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 tracking-wider mb-8 uppercase">Swipe or click to view pages</p>
          
          {/* Card Viewer Frame */}
          <div className="relative max-w-sm mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-4 border border-beige dark:border-zinc-800">
            <div className="relative aspect-[941/1672] w-full overflow-hidden rounded-xl bg-beige/40 dark:bg-zinc-950 cursor-zoom-in" onClick={() => setIsLightboxOpen(true)}>
              <Image 
                src={invitationCards[currentSlide]} 
                alt={`Invitation Card Page ${currentSlide + 1}`} 
                fill
                className="object-cover"
                sizes="(max-width: 400px) 100vw, 400px"
                priority
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors flex items-center justify-center group">
                <span className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to Zoom
                </span>
              </div>
            </div>

            {/* Left and Right arrows */}
            <button 
              onClick={handlePrevSlide}
              className="absolute -left-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-beige dark:border-zinc-700 hover:scale-105 active:scale-95 transition-all text-terracotta-500 cursor-pointer"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={handleNextSlide}
              className="absolute -right-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-beige dark:border-zinc-700 hover:scale-105 active:scale-95 transition-all text-terracotta-500 cursor-pointer"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Bullet Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {invitationCards.map((_, index) => (
              <button 
                key={index} 
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-terracotta-500 w-6' : 'bg-gray-300 dark:bg-zinc-700'}`}
                title={`Page ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox view */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition-all cursor-pointer"
          >
            <X size={28} />
          </button>
          
          <div className="relative max-h-[85vh] aspect-[941/1672] w-full max-w-md">
            <Image 
              src={invitationCards[currentSlide]} 
              alt={`Invitation Card Page ${currentSlide + 1} Lightbox`} 
              fill
              className="object-contain"
              sizes="(max-width: 500px) 100vw, 500px"
              priority
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button 
              onClick={handlePrevSlide}
              className="px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all flex items-center gap-1"
            >
              <ChevronLeft size={20} /> Prev
            </button>
            <span className="text-white/60 py-2">
              Page {currentSlide + 1} of {invitationCards.length}
            </span>
            <button 
              onClick={handleNextSlide}
              className="px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all flex items-center gap-1"
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Couple Story Timeline */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Heart className="w-8 h-8 text-terracotta-500 mx-auto mb-3 animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-serif text-olive-600 dark:text-olive-400 font-bold">Our Journey</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 tracking-wider mt-1 uppercase">A Story of Love &amp; Blessings</p>
        </div>

        {/* Timeline */}
        <div className="relative border-l-2 border-beige dark:border-zinc-800 ml-4 md:ml-1/2 space-y-12">
          
          {/* Card 1 */}
          <div className="relative pl-6 md:pl-0 md:w-1/2 md:translate-x-[-100%] md:pr-10 md:text-right">
            {/* Timeline Dot */}
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-terracotta-500 md:left-auto md:right-[-9px] border-4 border-cream dark:border-zinc-950"></div>
            
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-md border border-beige/60 dark:border-zinc-800">
              <span className="text-xs uppercase tracking-widest font-semibold text-olive-500">The Beginning</span>
              <h3 className="text-xl font-serif text-terracotta-600 dark:text-terracotta-500 mt-1 mb-2 font-bold">First Met</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">
                Our paths crossed through family introductions. What started as formal conversations slowly turned into deep, meaningful connections.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="relative pl-6 md:pl-0 md:w-1/2 md:translate-x-[100%] md:pl-10">
            {/* Timeline Dot */}
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-olive-500 border-4 border-cream dark:border-zinc-950"></div>
            
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-md border border-beige/60 dark:border-zinc-800">
              <span className="text-xs uppercase tracking-widest font-semibold text-olive-500">The Decision</span>
              <h3 className="text-xl font-serif text-terracotta-600 dark:text-terracotta-500 mt-1 mb-2 font-bold">Setting the Path</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">
                With the blessings of our parents and loved ones, we mutually decided to step into a life-long journey of companionship, trust, and shared dreams.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="relative pl-6 md:pl-0 md:w-1/2 md:translate-x-[-100%] md:pr-10 md:text-right">
            {/* Timeline Dot */}
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-terracotta-500 md:left-auto md:right-[-9px] border-4 border-cream dark:border-zinc-950"></div>
            
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-md border border-beige/60 dark:border-zinc-800">
              <span className="text-xs uppercase tracking-widest font-semibold text-olive-500">The Nikah</span>
              <h3 className="text-xl font-serif text-terracotta-600 dark:text-terracotta-500 mt-1 mb-2 font-bold">The Holy Bond</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">
                Saturday, July 25th, 2026 marks the day we exchange our Nikah vows, officially beginning our lives together in the presence of Allah.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Wedding Events Details */}
      <section id="events-section" className="bg-[#f5efe0]/30 dark:bg-zinc-900/30 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-olive-600 dark:text-olive-400 font-bold">The Ceremonies</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 tracking-wider mt-1 uppercase">Date, Timings, &amp; Details</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Nikah Ceremony Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-beige dark:border-zinc-800 p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-terracotta-50 rounded-full flex items-center justify-center text-terracotta-500 dark:bg-zinc-800 mb-6">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-2xl font-serif text-terracotta-600 dark:text-terracotta-500 font-bold mb-4">The Nikah Ceremony</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <Calendar className="text-olive-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-semibold text-sm">Saturday, 25th July, 2026</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="text-olive-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-semibold text-sm">11:00 AM – 11:30 AM</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Guests are requested to be seated by 10:45 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="text-olive-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-semibold text-sm">E.K. Nayanar Auditorium</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Payyambalam, Kannur, Kerala</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-beige/60 dark:border-zinc-800/60 pt-4">
                <span className="text-xs uppercase tracking-widest font-semibold text-gray-400 block mb-3">Dress Code</span>
                <p className="text-sm font-medium text-olive-600 dark:text-olive-400">Traditional / Elegant Formal attire</p>
              </div>
            </div>

            {/* Reception Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-beige dark:border-zinc-800 p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-olive-50 rounded-full flex items-center justify-center text-olive-500 dark:bg-zinc-800 mb-6">
                  <Heart size={24} />
                </div>
                <h3 className="text-2xl font-serif text-terracotta-600 dark:text-terracotta-500 font-bold mb-4">The Wedding Reception</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <Calendar className="text-olive-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-semibold text-sm">Saturday, 25th July, 2026</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="text-olive-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-semibold text-sm">12:00 PM – 3:00 PM</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Followed by a traditional wedding lunch feast</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="text-olive-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-semibold text-sm">E.K. Nayanar Auditorium</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Payyambalam, Kannur, Kerala</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-beige/60 dark:border-zinc-800/60 pt-4">
                <span className="text-xs uppercase tracking-widest font-semibold text-gray-400 block mb-3">Dress Code</span>
                <p className="text-sm font-medium text-olive-600 dark:text-olive-400">Semi-formal / Traditional Festive wear</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. RSVP Section */}
      <section id="rsvp-section" className="py-20 px-4 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif text-terracotta-600 dark:text-terracotta-500 font-bold">R.S.V.P</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 tracking-wider mt-1 uppercase">Will you celebrate with us?</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2 max-w-sm mx-auto">
            Please fill out the form by July 15, 2026 to help us organize the catering, seating, and parking arrangements.
          </p>
        </div>

        {submitStatus === 'success' ? (
          <div className="bg-white dark:bg-zinc-900 border-2 border-olive-500 rounded-2xl p-8 text-center shadow-xl space-y-6 animate-scale-up">
            <div className="w-16 h-16 bg-olive-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center text-olive-600 mx-auto">
              <Check size={36} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-serif text-terracotta-600 dark:text-terracotta-500 font-bold">Attendance Confirmed!</h3>
              <p className="text-gray-600 dark:text-zinc-300 leading-relaxed font-medium">
                {successMessage}
              </p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Thank you for confirming your attendance. We look forward to celebrating with you!
              </p>
            </div>

            <div className="pt-4 border-t border-beige/60 dark:border-zinc-800/60 flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => setSubmitStatus('idle')}
                className="px-6 py-2 border border-beige dark:border-zinc-700 text-sm text-gray-600 dark:text-zinc-300 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Update Response
              </button>
              <button 
                onClick={handleShareInvite}
                className="px-6 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-sm text-white rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto sm:mx-0"
              >
                <Share2 size={16} /> Share invitation
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitRsvp} className="bg-white dark:bg-zinc-900 border border-beige dark:border-zinc-800 rounded-2xl p-6 md:p-10 shadow-xl space-y-6">
            
            {formErrors && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl p-4 flex gap-3 text-sm">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="font-medium">{formErrors}</p>
              </div>
            )}

            {/* Guest Full Name */}
            <div className="space-y-2">
              <label htmlFor="guestName" className="text-sm font-semibold text-gray-600 dark:text-zinc-300 block">
                Guest Full Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                id="guestName" 
                name="guestName" 
                value={rsvpForm.guestName}
                onChange={handleFormChange}
                placeholder="e.g. John Doe & Family"
                className="w-full px-4 py-3 rounded-xl border border-beige dark:border-zinc-800 bg-cream/10 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-terracotta-500 transition-all"
                required
              />
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-600 dark:text-zinc-300 block">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel" 
                id="phoneNumber" 
                name="phoneNumber" 
                value={rsvpForm.phoneNumber}
                onChange={handleFormChange}
                placeholder="e.g. 9876543210 (Used for duplicate checks & updates)"
                className="w-full px-4 py-3 rounded-xl border border-beige dark:border-zinc-800 bg-cream/10 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-terracotta-500 transition-all"
                required
              />
            </div>

            {/* Attendance Status */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 dark:text-zinc-300 block">
                Attendance Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAttendance('attending')}
                  className={`py-3 rounded-xl border font-medium text-sm transition-all cursor-pointer ${rsvpForm.attendanceStatus === 'attending' ? 'bg-terracotta-500 text-white border-terracotta-500 shadow-md shadow-terracotta-500/10' : 'bg-transparent border-beige dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                >
                  Yes, I will attend
                </button>
                <button
                  type="button"
                  onClick={() => setAttendance('declined')}
                  className={`py-3 rounded-xl border font-medium text-sm transition-all cursor-pointer ${rsvpForm.attendanceStatus === 'declined' ? 'bg-terracotta-500 text-white border-terracotta-500 shadow-md shadow-terracotta-500/10' : 'bg-transparent border-beige dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                >
                  Sorry, I cannot attend
                </button>
              </div>
            </div>

            {/* Dynamic fields if attending */}
            {rsvpForm.attendanceStatus === 'attending' && (
              <div className="space-y-6 pt-4 border-t border-beige/60 dark:border-zinc-800/60 animate-fade-in">
                
                {/* Guest counter */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Adults */}
                  <div className="space-y-2 bg-cream/20 dark:bg-zinc-950/20 p-4 border border-beige dark:border-zinc-800/80 rounded-xl">
                    <label className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-zinc-400 block text-center">Adults</label>
                    <div className="flex items-center justify-between mt-1">
                      <button
                        type="button"
                        onClick={() => adjustNumber('adultsCount', -1, 1)}
                        className="w-8 h-8 rounded-full border border-beige dark:border-zinc-700 bg-white dark:bg-zinc-800 text-terracotta-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold font-serif w-8 text-center">{rsvpForm.adultsCount}</span>
                      <button
                        type="button"
                        onClick={() => adjustNumber('adultsCount', 1)}
                        className="w-8 h-8 rounded-full border border-beige dark:border-zinc-700 bg-white dark:bg-zinc-800 text-terracotta-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="space-y-2 bg-cream/20 dark:bg-zinc-950/20 p-4 border border-beige dark:border-zinc-800/80 rounded-xl">
                    <label className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-zinc-400 block text-center">Children</label>
                    <div className="flex items-center justify-between mt-1">
                      <button
                        type="button"
                        onClick={() => adjustNumber('childrenCount', -1, 0)}
                        className="w-8 h-8 rounded-full border border-beige dark:border-zinc-700 bg-white dark:bg-zinc-800 text-terracotta-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold font-serif w-8 text-center">{rsvpForm.childrenCount}</span>
                      <button
                        type="button"
                        onClick={() => adjustNumber('childrenCount', 1)}
                        className="w-8 h-8 rounded-full border border-beige dark:border-zinc-700 bg-white dark:bg-zinc-800 text-terracotta-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Food preferences */}
                <div className="space-y-4 bg-cream/20 dark:bg-zinc-950/20 p-4 border border-beige dark:border-zinc-800/80 rounded-xl">
                  <div className="flex justify-between items-center border-b border-beige/60 dark:border-zinc-800/60 pb-2 mb-2">
                    <label className="text-sm font-semibold text-gray-600 dark:text-zinc-300 block">Food Preferences</label>
                    <span className="text-xs text-olive-600 dark:text-olive-400 font-semibold uppercase">Total required: {totalMembers}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Vegetarian */}
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500 block text-center">Vegetarian</label>
                      <div className="flex items-center justify-between mt-1">
                        <button
                          type="button"
                          onClick={() => adjustNumber('vegCount', -1, 0)}
                          className="w-8 h-8 rounded-full border border-beige dark:border-zinc-700 bg-white dark:bg-zinc-800 text-olive-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-md font-bold font-serif w-8 text-center">{rsvpForm.vegCount}</span>
                        <button
                          type="button"
                          onClick={() => adjustNumber('vegCount', 1)}
                          className="w-8 h-8 rounded-full border border-beige dark:border-zinc-700 bg-white dark:bg-zinc-800 text-olive-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Non-Vegetarian */}
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500 block text-center">Non-Vegetarian</label>
                      <div className="flex items-center justify-between mt-1">
                        <button
                          type="button"
                          onClick={() => adjustNumber('nonvegCount', -1, 0)}
                          className="w-8 h-8 rounded-full border border-beige dark:border-zinc-700 bg-white dark:bg-zinc-800 text-olive-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-md font-bold font-serif w-8 text-center">{rsvpForm.nonvegCount}</span>
                        <button
                          type="button"
                          onClick={() => adjustNumber('nonvegCount', 1)}
                          className="w-8 h-8 rounded-full border border-beige dark:border-zinc-700 bg-white dark:bg-zinc-800 text-olive-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Warning if counts mismatch */}
                  {totalMembers !== (rsvpForm.vegCount + rsvpForm.nonvegCount) && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium text-center">
                      ⚠️ Mismatch: Food counts must equal total guest count ({totalMembers})
                    </div>
                  )}
                </div>

                {/* Additional checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Will Attend Reception? */}
                  <label className="flex items-center gap-3 p-3.5 border border-beige dark:border-zinc-800 bg-cream/10 dark:bg-zinc-950 rounded-xl cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rsvpForm.receptionAttendance}
                      onChange={(e) => setCheckboxVal('receptionAttendance', e.target.checked)}
                      className="w-5 h-5 accent-terracotta-500 rounded cursor-pointer"
                    />
                    <div className="text-xs sm:text-sm">
                      <span className="font-semibold block">Will Attend Reception?</span>
                      <span className="text-gray-400 dark:text-zinc-500 text-[10px] sm:text-xs">Reception feasting & photos</span>
                    </div>
                  </label>

                  {/* Need Parking? */}
                  <label className="flex items-center gap-3 p-3.5 border border-beige dark:border-zinc-800 bg-cream/10 dark:bg-zinc-950 rounded-xl cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rsvpForm.parkingRequired}
                      onChange={(e) => setCheckboxVal('parkingRequired', e.target.checked)}
                      className="w-5 h-5 accent-terracotta-500 rounded cursor-pointer"
                    />
                    <div className="text-xs sm:text-sm">
                      <span className="font-semibold block">Need Parking Space?</span>
                      <span className="text-gray-400 dark:text-zinc-500 text-[10px] sm:text-xs">Reserve car/bike parking slot</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Special Notes or Message */}
            <div className="space-y-2">
              <label htmlFor="specialMessage" className="text-sm font-semibold text-gray-600 dark:text-zinc-300 block">
                Special Notes or Message to the Couple
              </label>
              <textarea 
                id="specialMessage" 
                name="specialMessage" 
                value={rsvpForm.specialMessage}
                onChange={handleFormChange}
                rows={3}
                placeholder="Share your prayers, wishes, or dietary restrictions..."
                className="w-full px-4 py-3 rounded-xl border border-beige dark:border-zinc-800 bg-cream/10 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-terracotta-500 transition-all text-sm"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl text-white font-semibold tracking-wider hover:shadow-lg transition-all active:scale-99 cursor-pointer flex items-center justify-center gap-2 ${isSubmitting ? 'bg-terracotta-400 cursor-not-allowed' : 'bg-terracotta-500 hover:bg-terracotta-600'}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Confirming...
                </>
              ) : (
                'Confirm My Attendance'
              )}
            </button>
          </form>
        )}
      </section>

      {/* 7. Location Section */}
      <section className="bg-[#f5efe0]/30 dark:bg-zinc-900/30 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <MapPin className="w-8 h-8 text-olive-500 mx-auto mb-3" />
            <h2 className="text-3xl md:text-4xl font-serif text-olive-600 dark:text-olive-400 font-bold">The Venue</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 tracking-wider mt-1 uppercase">E.K. Nayanar Auditorium</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2 max-w-md mx-auto">
              Located near the scenic Payyambalam Beach, Kannur. Follow the navigation map below.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-beige dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl grid md:grid-cols-12">
            
            {/* Map Address Detail */}
            <div className="p-8 md:col-span-5 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-semibold text-gray-400">Address</h4>
                  <p className="text-md font-medium text-terracotta-600 dark:text-terracotta-500 mt-1 font-serif">
                    E.K. Nayanar Memorial Academy / Auditorium
                  </p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                    Payyambalam Beach Road, Kannur,<br />
                    Kerala - 670001, India
                  </p>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-widest font-semibold text-gray-400">Venue Contact</h4>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                    +91 8714406947 / +91 9037113220
                  </p>
                </div>
              </div>

              {/* Navigation button */}
              <a 
                href="https://www.google.com/maps/place/Nayanar+Academy/@11.8603737,75.3602826,17z/data=!3m1!4b1!4m6!3m5!1s0x3ba4233c60a6ce63:0xfe2350506defbd8!8m2!3d11.8603737!4d75.3602826!16s%2Fg%2F11t4cdxq1m"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 px-6 py-3.5 bg-olive-500 text-white font-medium rounded-xl shadow-md hover:bg-olive-600 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Navigation size={18} /> Open Google Maps
              </a>
            </div>

            {/* Google Map IFrame */}
            <div className="md:col-span-7 h-80 md:h-auto min-h-[320px] relative border-t md:border-t-0 md:border-l border-beige dark:border-zinc-800">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3901.7672200234726!2d75.3580939153328!3d11.860373691591873!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba4233c60a6ce63%3A0xfe2350506defbd8!2sNayanar%20Academy!5e0!3m2!1sen!2sin!4v1655000000000!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 grayscale dark:invert-[0.9] dark:hue-rotate-180 opacity-90"
              ></iframe>
            </div>

          </div>

          {/* Venue image optimized WebP */}
          <div className="mt-8 relative aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-lg border border-beige dark:border-zinc-800">
            <Image 
              src="/images/venue-photo.webp" 
              alt="E.K. Nayanar Auditorium Venue Outer View" 
              fill
              className="object-cover"
              sizes="(max-width: 800px) 100vw, 800px"
            />
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 px-4 border-t border-beige/60 dark:border-zinc-800/60 max-w-4xl mx-auto mt-16">
        <p className="text-xs uppercase tracking-[0.2em] text-olive-500 font-semibold mb-2">With Love &amp; Duas</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Best wishes from family and kith &amp; kin.</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-8">&copy; 2026 Zainul Fouz &amp; Zuhair Wedding. All rights reserved.</p>
      </footer>

      {/* Inline styling animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-up {
          animation: scaleUp 0.4s ease-out forwards;
        }
      `}</style>

    </div>
  );
}
