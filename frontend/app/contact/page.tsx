'use client';

import Navbar from '@/components/ui/navbar';
import { Loader2, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import React, { useState } from 'react';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  let contactInfo = {
    email: 'contact.professionalsbd@gmail.com',
    phone: '+880 1805-543685',
    address: 'Subashati Syed Center, Chawkbazar, Chattogram, Bangladesh'
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      alert('Message sent! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
              Have questions? We'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Mail,
                title: "Email Us",
                content: contactInfo.email,
                href: `mailto:${contactInfo.email}`,
              },
              {
                icon: Phone,
                title: "Call Us",
                content: contactInfo.phone,
                href: `tel:${contactInfo.phone}`,
              },
              {
                icon: MapPin,
                title: "Location",
                content: contactInfo.address,
                href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  contactInfo.address
                )}`,
                target: "_blank",
              },
            ].map((item, index) => (
              <a
                key={index}
                href={item.href}
                target={item.target}
                rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                className="glass rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center hover:border-primary-500/50 transition-all cursor-pointer group block"
              >
                <div className="w-14 h-14 bg-primary-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wide mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {item.content}
                </p>
              </a>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12">
            <div className="flex items-center gap-3 mb-8">
              <MessageCircle className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Send a Message
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    placeholder='Enter your name'
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 transition-colors"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    placeholder='Enter your email'
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 transition-colors"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Subject</label>
                <input
                  type="text"
                  required
                  placeholder='Enter your subject'
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 transition-colors"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Message</label>
                <textarea
                  required
                  placeholder='Enter your message'
                  rows={6}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 transition-colors resize-none"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send Message</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
