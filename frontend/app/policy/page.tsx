'use client';

import Navbar from '@/components/ui/navbar';
import { Shield } from 'lucide-react';

export default function PolicyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex p-4 bg-primary-600/10 rounded-3xl border border-primary-500/20 mb-6">
              <Shield className="w-10 h-10 text-primary-500" />
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Last updated: January 10, 2026
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 space-y-8 text-slate-600 dark:text-slate-300">
            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                1. Information We Collect
              </h2>
              <p className="leading-relaxed mb-3">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Personal information (name, email, phone number)</li>
                <li>Professional credentials and qualifications</li>
                <li>Payment information</li>
                <li>Communication records and consultation history</li>
                <li>Device and usage information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                2. How We Use Your Information
              </h2>
              <p className="leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends and usage</li>
                <li>Detect, prevent, and address fraudulent or illegal activity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                3. Information Sharing
              </h2>
              <p className="leading-relaxed mb-3">
                We do not sell your personal information. We may share information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>With professionals you book consultations with</li>
                <li>With service providers who perform services on our behalf</li>
                <li>When required by law or to protect rights and safety</li>
                <li>With your consent or at your direction</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                4. Data Security
              </h2>
              <p className="leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, regular security assessments, and access controls.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                5. Data Retention
              </h2>
              <p className="leading-relaxed">
                We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your account and associated data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                6. Your Rights
              </h2>
              <p className="leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access and receive a copy of your personal  information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your information</li>
                <li>Object to processing of your information</li>
                <li>Withdraw consent where processing is based on consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                7. Cookies and Tracking
              </h2>
              <p className="leading-relaxed">
                We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings, though this may affect platform functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                8. Children's Privacy
              </h2>
              <p className="leading-relaxed">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                9. Changes to Privacy Policy
              </h2>
              <p className="leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of significant changes via email or prominent notice on our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                10. Contact Us
              </h2>
              <p className="leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at privacy@professionalsbd.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
