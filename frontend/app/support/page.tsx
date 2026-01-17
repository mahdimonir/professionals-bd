'use client';

import Navbar from '@/components/ui/navbar';
import { HelpCircle, Mail, MessageCircle, Search } from 'lucide-react';
import { useState } from 'react';
import { toast, Toaster } from 'sonner';

export default function PublicSupportPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleContactSupport = () => {
    toast.success('Support ticket created! We will contact you shortly.');
  };

  const FAQS = [
    {
      question: "How do I change my password?",
      answer: "Go to your Profile > Settings tab and scroll down to the Security section."
    },
    {
      question: "Where can I download my invoices?",
      answer: "Log in and go to Profile > Billing tab to find all your past invoices."
    },
    {
      question: "How do I dispute a payment?",
      answer: "Go to Profile > Disputes tab and click 'File New Dispute'. You will need to select the booking ID."
    },
    {
      question: "How do I become a professional?",
      answer: "Click 'Join as Pro' in the navigation bar to start your application process."
    },
    {
      question: "Is my payment information secure?",
      answer: "Yes, we use industry-standard encryption and trusted payment gateways (SSLCommerz) to ensure your data is safe."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
            How can we help you?
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Find answers to common questions or contact our support team directly.
          </p>
        </div>

        {/* Search & Hero Card */}
        <div className="bg-gradient-to-br from-primary-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-xl mb-12">
          <div className="relative z-10 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-4 w-6 h-6 text-slate-400" />
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-900 pl-12 pr-6 py-4 rounded-2xl shadow-lg border-0 focus:ring-4 focus:ring-primary-400/30 outline-none text-lg placeholder:text-slate-400"
              />
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl translate-x-20 translate-y-20" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <button 
            onClick={handleContactSupport}
            className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-primary-200 dark:hover:border-primary-800 transition-all text-left shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Live Chat</h3>
            <p className="text-slate-500 dark:text-slate-400">Chat with our support team in real-time. Available 9am - 6pm.</p>
          </button>

          <button 
            onClick={() => toast.info('Email support form opening...')}
            className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-primary-200 dark:hover:border-primary-800 transition-all text-left shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Email Support</h3>
            <p className="text-slate-500 dark:text-slate-400">Get help via email. We usually respond within 24 hours.</p>
          </button>
        </div>

        {/* FAQs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <HelpCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          </div>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {FAQS.filter(f => f.question.toLowerCase().includes(searchQuery.toLowerCase())).map((faq, i) => (
              <div key={i} className="py-6 first:pt-0 last:pb-0">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{faq.question}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
