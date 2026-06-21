'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Users, UserCheck, Heart, UserPlus, Pizza, 
  Car, UserMinus, Search, Download, LogOut, 
  QrCode, Copy, Send, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';
import { supabase } from '.././../lib/supabase';
import { logoutAdmin } from '../actions';

interface RSVPRecord {
  id: string;
  guest_name: string;
  phone_number: string;
  attendance_status: 'attending' | 'declined';
  adults_count: number;
  children_count: number;
  veg_count: number;
  nonveg_count: number;
  reception_attendance: boolean;
  parking_required: boolean;
  special_message: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [rsvps, setRsvps] = useState<RSVPRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'attending' | 'declined' | 'veg' | 'nonveg' | 'reception' | 'parking'>('all');

  // Generator states
  const [generatorName, setGeneratorName] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Fetch RSVPs function
  const fetchRSVPs = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching RSVPs:', error);
      } else {
        setRsvps(data || []);
      }
    } catch (err) {
      console.error('Exception in fetch:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchRSVPs(true);

    // Create channel
    const channel = supabase
      .channel('rsvp-admin-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rsvps' },
        () => {
          console.log('Realtime change detected, refreshing...');
          fetchRSVPs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRSVPs();
  };

  const handleLogout = async () => {
    await logoutAdmin();
    router.push('/admin/login');
    router.refresh();
  };

  // Generate Invite Link and QR Code
  const handleGenerateLink = () => {
    if (!generatorName.trim()) return;
    const origin = window.location.origin;
    const encodedName = encodeURIComponent(generatorName.trim());
    const inviteUrl = `${origin}?to=${encodedName}`;
    
    setGeneratedUrl(inviteUrl);
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`);
    setIsCopied(false);
  };

  const handleCopyLink = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleWhatsAppShare = () => {
    if (!generatedUrl) return;
    const text = `Dear ${generatorName},\n\nWe cordially invite you to join us in celebrating our wedding ceremony and reception.\n\nPlease find the invitation details and confirm your RSVP here:\n${generatedUrl}\n\nWith Love,\nZainul Fouz & Zuhair`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Calculate Metrics
  const totalResponded = rsvps.length;
  const totalAttendingRSVPs = rsvps.filter(r => r.attendance_status === 'attending');
  const totalDeclinedRSVPs = rsvps.filter(r => r.attendance_status === 'declined');

  const totalConfirmedFamilies = totalAttendingRSVPs.length;
  const totalDeclinedCount = totalDeclinedRSVPs.length;
  
  let totalGuests = 0;
  let totalAdults = 0;
  let totalChildren = 0;
  let totalVeg = 0;
  let totalNonVeg = 0;
  let totalReception = 0;
  let totalParking = 0;

  totalAttendingRSVPs.forEach(r => {
    totalAdults += r.adults_count || 0;
    totalChildren += r.children_count || 0;
    totalVeg += r.veg_count || 0;
    totalNonVeg += r.nonveg_count || 0;
    if (r.reception_attendance) totalReception += (r.adults_count + r.children_count);
    if (r.parking_required) totalParking += 1;
  });
  totalGuests = totalAdults + totalChildren;

  // Search & Filter Logic
  const filteredRSVPs = rsvps.filter(r => {
    // Search filter
    const matchesSearch = 
      r.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.phone_number.includes(searchTerm);

    if (!matchesSearch) return false;

    // Category filter
    switch (activeFilter) {
      case 'attending':
        return r.attendance_status === 'attending';
      case 'declined':
        return r.attendance_status === 'declined';
      case 'veg':
        return r.attendance_status === 'attending' && r.veg_count > 0;
      case 'nonveg':
        return r.attendance_status === 'attending' && r.nonveg_count > 0;
      case 'reception':
        return r.attendance_status === 'attending' && r.reception_attendance;
      case 'parking':
        return r.attendance_status === 'attending' && r.parking_required;
      default:
        return true;
    }
  });

  // Export Data to CSV
  const handleExportCSV = () => {
    if (filteredRSVPs.length === 0) return;

    // Headers
    const headers = [
      'Guest Name', 'Phone Number', 'Attendance', 'Adults', 
      'Children', 'Vegetarian Meals', 'Non-Vegetarian Meals', 
      'Attending Reception', 'Parking Requested', 'Submission Date', 'Special Note'
    ];

    // Rows
    const rows = filteredRSVPs.map(r => [
      `"${r.guest_name.replace(/"/g, '""')}"`,
      `'${r.phone_number}`, // Prefix with single quote to prevent number formatting truncation in excel
      r.attendance_status.toUpperCase(),
      r.adults_count,
      r.children_count,
      r.veg_count,
      r.nonveg_count,
      r.reception_attendance ? 'YES' : 'NO',
      r.parking_required ? 'YES' : 'NO',
      new Date(r.created_at).toLocaleDateString(),
      `"${(r.special_message || '').replace(/"/g, '""')}"`
    ]);

    // Construct CSV with BOM for Microsoft Excel encoding support
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wedding_rsvps_export_${activeFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (as tab separated values with BOM so excel opens it clean)
  const handleExportExcel = () => {
    if (filteredRSVPs.length === 0) return;

    // Headers
    const headers = [
      'Guest Name', 'Phone Number', 'Attendance', 'Adults', 
      'Children', 'Veg Count', 'Non-Veg Count', 
      'Reception Attendance', 'Parking Required', 'Submission Date', 'Special Message'
    ];

    // Rows (use tabs for separators)
    const rows = filteredRSVPs.map(r => [
      r.guest_name,
      r.phone_number,
      r.attendance_status.toUpperCase(),
      r.adults_count,
      r.children_count,
      r.veg_count,
      r.nonveg_count,
      r.reception_attendance ? 'Yes' : 'No',
      r.parking_required ? 'Yes' : 'No',
      new Date(r.created_at).toLocaleDateString(),
      r.special_message || ''
    ]);

    const tsvContent = '\uFEFF' + [headers.join('\t'), ...rows.map(e => e.join('\t'))].join('\n');
    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wedding_rsvps_${activeFilter}_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-zinc-950 p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-zinc-900 border border-beige dark:border-zinc-800 p-6 rounded-2xl shadow-md gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 relative rounded-full border border-gold-500/20 bg-cream/40 dark:bg-zinc-800 flex items-center justify-center hidden sm:flex">
              <Image src="/images/monogram.webp" alt="Z&Z" width={36} height={36} className="opacity-90 dark:brightness-110" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-terracotta-600 dark:text-terracotta-500 font-bold">RSVP Control Panel</h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-widest mt-0.5">Zainul Fouz &amp; Zuhair Wedding</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              className={`p-2.5 rounded-xl border border-beige dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
              title="Sync Data"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-950/20 dark:border-red-900/60 dark:text-red-400 rounded-xl transition-all font-medium text-sm flex items-center gap-2 cursor-pointer"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* Metrics Grid */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Card 1: Total responses */}
          <div className="bg-white dark:bg-zinc-900 border border-beige dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Total RSVPs</span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-bold font-serif text-terracotta-600 dark:text-terracotta-500">{totalResponded}</span>
              <span className="text-xs text-gray-500">responses</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
              <Users size={12} /> responses submitted
            </div>
          </div>

          {/* Card 2: Confirmed Families */}
          <div className="bg-white dark:bg-zinc-900 border border-beige dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Attending Families</span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-bold font-serif text-olive-600 dark:text-olive-400">{totalConfirmedFamilies}</span>
              <span className="text-xs text-gray-500">families</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
              <UserCheck size={12} /> confirmed attendance
            </div>
          </div>

          {/* Card 3: Total Guests / Adults / Children */}
          <div className="bg-white dark:bg-zinc-900 border border-beige dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Total Guests Attending</span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-bold font-serif text-gold-600 dark:text-gold-500">{totalGuests}</span>
              <span className="text-xs text-gray-500">guests</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-2">
              👨 {totalAdults} Adults &bull; 👧 {totalChildren} Children
            </div>
          </div>

          {/* Card 4: Catering Breakdown */}
          <div className="bg-white dark:bg-zinc-900 border border-beige dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Meals Catering</span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-2xl font-bold font-serif text-olive-600 dark:text-olive-400">{totalVeg} V</span>
              <span className="text-2xl font-bold font-serif text-terracotta-600 dark:text-terracotta-500">/ {totalNonVeg} NV</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
              <Pizza size={12} /> total meal portions required
            </div>
          </div>

          {/* Card 5: Parking & Declined */}
          <div className="bg-white dark:bg-zinc-900 border border-beige dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Parking &amp; Declined</span>
            <div className="flex items-baseline gap-3 mt-4">
              <div>
                <span className="text-2xl font-bold font-serif text-blue-600">{totalParking}</span>
                <span className="text-[10px] text-gray-400 block">Cars</span>
              </div>
              <div className="border-l border-beige pl-3 dark:border-zinc-800">
                <span className="text-2xl font-bold font-serif text-red-500">{totalDeclinedCount}</span>
                <span className="text-[10px] text-gray-400 block">Declined</span>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
              <Car size={12} /> parking spaces requested
            </div>
          </div>

        </section>

        {/* Dynamic Link / QR Code Invitation Generator */}
        <section className="bg-white dark:bg-zinc-900 border border-beige dark:border-zinc-800 p-6 rounded-2xl shadow-md">
          <div className="flex items-center gap-2 mb-4 border-b border-beige/60 dark:border-zinc-800/60 pb-3">
            <QrCode className="text-terracotta-500" size={22} />
            <h2 className="text-lg font-serif text-gray-700 dark:text-zinc-200 font-bold">Generate Personalized Guest Invitation URL</h2>
          </div>

          <div className="grid md:grid-cols-12 gap-6 items-start">
            {/* Form Inputs */}
            <div className="md:col-span-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={generatorName}
                  onChange={(e) => setGeneratorName(e.target.value)}
                  placeholder="e.g. John Doe & Family"
                  className="flex-1 px-4 py-3 rounded-xl border border-beige dark:border-zinc-800 bg-cream/10 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-terracotta-500 text-sm"
                />
                <button
                  onClick={handleGenerateLink}
                  className="px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-medium text-sm transition-all cursor-pointer whitespace-nowrap active:scale-98"
                >
                  Generate Link
                </button>
              </div>

              {generatedUrl && (
                <div className="bg-cream/20 dark:bg-zinc-950/20 border border-beige dark:border-zinc-800 p-4 rounded-xl space-y-3 animate-fade-in">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-gray-400">Personalized Invitation URL</span>
                    <p className="text-xs break-all font-mono text-terracotta-600 dark:text-terracotta-400 mt-1 select-all bg-white dark:bg-zinc-900 p-2 rounded border border-beige/40">
                      {generatedUrl}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 border border-beige dark:border-zinc-700 text-xs rounded-lg hover:bg-white dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-all cursor-pointer font-medium"
                    >
                      <Copy size={14} /> {isCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={handleWhatsAppShare}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-medium"
                    >
                      <Send size={14} /> WhatsApp Invitation details
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Container */}
            <div className="md:col-span-4 flex justify-center">
              {qrCodeUrl ? (
                <div className="bg-white p-4 border border-beige/80 rounded-2xl shadow-sm text-center max-w-[240px]">
                  <img src={qrCodeUrl} alt="Invitation QR Code" className="mx-auto rounded-lg" />
                  <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">Scan to open invite for</p>
                  <p className="text-xs font-semibold mt-0.5 truncate">{generatorName}</p>
                </div>
              ) : (
                <div className="h-44 w-full border-2 border-dashed border-beige dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center text-gray-400 p-4">
                  <QrCode size={36} className="opacity-40 mb-2" />
                  <p className="text-xs">Submit guest name to generate dynamic QR Code</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Data Table Section */}
        <section className="bg-white dark:bg-zinc-900 border border-beige dark:border-zinc-800 rounded-2xl shadow-md overflow-hidden">
          
          {/* Table Toolbar */}
          <div className="p-6 border-b border-beige/60 dark:border-zinc-800/60 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search guest name or mobile number..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-beige dark:border-zinc-800 bg-cream/10 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-terracotta-500 text-sm"
                />
                <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportCSV}
                  disabled={filteredRSVPs.length === 0}
                  className="px-4 py-2.5 border border-beige dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download size={14} /> Export CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={filteredRSVPs.length === 0}
                  className="px-4 py-2.5 border border-beige dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download size={14} /> Export Excel
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${activeFilter === 'all' ? 'bg-terracotta-500 text-white shadow-sm' : 'bg-cream/30 dark:bg-zinc-800/40 border border-beige/60 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              >
                All Responses ({totalResponded})
              </button>
              <button 
                onClick={() => setActiveFilter('attending')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${activeFilter === 'attending' ? 'bg-olive-500 text-white shadow-sm' : 'bg-cream/30 dark:bg-zinc-800/40 border border-beige/60 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              >
                Attending ({totalConfirmedFamilies})
              </button>
              <button 
                onClick={() => setActiveFilter('declined')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${activeFilter === 'declined' ? 'bg-red-500 text-white shadow-sm' : 'bg-cream/30 dark:bg-zinc-800/40 border border-beige/60 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              >
                Declined ({totalDeclinedCount})
              </button>
              <button 
                onClick={() => setActiveFilter('veg')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${activeFilter === 'veg' ? 'bg-green-600 text-white shadow-sm' : 'bg-cream/30 dark:bg-zinc-800/40 border border-beige/60 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              >
                Vegetarian
              </button>
              <button 
                onClick={() => setActiveFilter('nonveg')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${activeFilter === 'nonveg' ? 'bg-orange-500 text-white shadow-sm' : 'bg-cream/30 dark:bg-zinc-800/40 border border-beige/60 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              >
                Non-Vegetarian
              </button>
              <button 
                onClick={() => setActiveFilter('reception')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${activeFilter === 'reception' ? 'bg-blue-600 text-white shadow-sm' : 'bg-cream/30 dark:bg-zinc-800/40 border border-beige/60 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              >
                Reception Guests
              </button>
              <button 
                onClick={() => setActiveFilter('parking')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${activeFilter === 'parking' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-cream/30 dark:bg-zinc-800/40 border border-beige/60 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              >
                Need Parking ({totalParking})
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-20 text-center font-serif text-gray-400 text-lg animate-pulse">
                Loading database RSVPs...
              </div>
            ) : filteredRSVPs.length === 0 ? (
              <div className="py-20 text-center text-gray-400 text-sm">
                No RSVP responses matched the current search or filters.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-cream/30 dark:bg-zinc-800/20 text-gray-500 uppercase tracking-widest text-[10px] font-bold border-b border-beige/40 dark:border-zinc-800/40">
                    <th className="py-4 px-6">Guest Name</th>
                    <th className="py-4 px-6">Phone Number</th>
                    <th className="py-4 px-6">Attendance</th>
                    <th className="py-4 px-6 text-center">Adults</th>
                    <th className="py-4 px-6 text-center">Children</th>
                    <th className="py-4 px-6 text-center">Veg</th>
                    <th className="py-4 px-6 text-center">Non-Veg</th>
                    <th className="py-4 px-6">Reception</th>
                    <th className="py-4 px-6">Parking</th>
                    <th className="py-4 px-6">Date Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/40 dark:divide-zinc-800/40">
                  {filteredRSVPs.map((rsvp) => (
                    <React.Fragment key={rsvp.id}>
                      <tr className="hover:bg-cream/10 dark:hover:bg-zinc-800/10 transition-colors">
                        <td className="py-4 px-6 font-semibold">
                          {rsvp.guest_name}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs">
                          {rsvp.phone_number}
                        </td>
                        <td className="py-4 px-6">
                          {rsvp.attendance_status === 'attending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-xs font-semibold">
                              <CheckCircle size={12} /> Attending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold">
                              <XCircle size={12} /> Declined
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center font-mono font-medium">
                          {rsvp.attendance_status === 'attending' ? rsvp.adults_count : 0}
                        </td>
                        <td className="py-4 px-6 text-center font-mono font-medium">
                          {rsvp.attendance_status === 'attending' ? rsvp.children_count : 0}
                        </td>
                        <td className="py-4 px-6 text-center font-mono text-olive-600 dark:text-olive-400 font-semibold">
                          {rsvp.attendance_status === 'attending' ? rsvp.veg_count : 0}
                        </td>
                        <td className="py-4 px-6 text-center font-mono text-terracotta-600 dark:text-terracotta-500 font-semibold">
                          {rsvp.attendance_status === 'attending' ? rsvp.nonveg_count : 0}
                        </td>
                        <td className="py-4 px-6">
                          {rsvp.attendance_status === 'attending' ? (
                            rsvp.reception_attendance ? (
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Yes</span>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-zinc-600">No</span>
                            )
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-zinc-600">&mdash;</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {rsvp.attendance_status === 'attending' ? (
                            rsvp.parking_required ? (
                              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Requested</span>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-zinc-600">No</span>
                            )
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-zinc-600">&mdash;</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-400 dark:text-zinc-500 whitespace-nowrap">
                          {new Date(rsvp.created_at).toLocaleString()}
                        </td>
                      </tr>
                      {rsvp.special_message && (
                        <tr className="bg-cream/5 dark:bg-zinc-800/5">
                          <td colSpan={10} className="py-2.5 px-6 text-xs text-gray-500 dark:text-zinc-400 border-b border-beige/20 italic">
                            <span className="font-semibold not-italic text-[10px] text-olive-600 dark:text-olive-400 uppercase tracking-widest mr-2">Note:</span>
                            &ldquo;{rsvp.special_message}&rdquo;
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </section>

      </div>
    </div>
  );
}
