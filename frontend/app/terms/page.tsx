'use client';

import Navbar from '@/components/ui/navbar';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex p-4 bg-primary-600/10 rounded-3xl border border-primary-500/20 mb-6">
              <FileText className="w-10 h-10 text-primary-500" />
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
              Terms of Service
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Last updated: January 10, 2026
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 space-y-8 text-slate-600 dark:text-slate-300">
            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="leading-relaxed">
                By accessing and using ProfessionalsBD, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                2. User Accounts
              </h2>
              <p className="leading-relaxed mb-3">
                When you create an account with us, you must provide accurate, complete, and up-to-date information. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of unauthorized account access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                3. Professional Services
              </h2>
              <p className="leading-relaxed">
                ProfessionalsBD acts as a platform connecting users with professionals. We do not provide professional services directly. All consultations and services are provided by independent professionals listed on our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                4. Payment Terms
              </h2>
              <p className="leading-relaxed mb-3">
                All payments are processed securely through our integrated payment providers. By using our services, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide valid payment information</li>
                <li>Pay all applicable fees as described at the time of booking</li>
                <li>Understand that cancellation policies vary by professional</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                5. User Conduct
              </h2>
              <p className="leading-relaxed mb-3">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any laws or regulations</li>
                <li>Harass, abuse, or harm other users or professionals</li>
                <li>Upload malicious code or viruses</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the platform for any fraudulent or illegal purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                6. Intellectual Property
              </h2>
              <p className="leading-relaxed">
                All content on ProfessionalsBD, including text, graphics, logos, and software, is the property of ProfessionalsBD or its content suppliers and is protected by international copyright laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                7. Limitation of Liability
              </h2>
              <p className="leading-relaxed">
                ProfessionalsBD shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                8. Changes to Terms
              </h2>
              <p className="leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of significant changes via email or platform notification. Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                9. Contact Information
              </h2>
              <p className="leading-relaxed">
                If you have questions about these Terms of Service, please contact us at legal@professionalsbd.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
