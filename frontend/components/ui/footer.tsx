import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-24 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-16">
        <div className="space-y-6 text-left">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="group-hover:scale-110 transition-transform duration-300">
              <Image 
                src="/ProBD-Logo.png" 
                alt="ProfessionalsBD Logo" 
                width={150} 
                height={150} 
                className="w-6 h-6 object-contain"
                priority
              />
            </div>
            <span className="text-xl font-black tracking-tight transition-colors text-slate-900 dark:text-white">
              Professionals<span className="text-primary-600">BD</span>
            </span>
          </Link>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            The high-trust expert network platform for the Bangladeshi digital economy.
          </p>
        </div>
        {['Network', 'Platform', 'Legal'].map((group, idx) => (
          <div key={idx} className="text-left">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">{group}</h4>
            <ul className="space-y-4">
              <li><Link href="/professionals" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors">Find Experts</Link></li>
              <li><Link href="/about" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors">How it Works</Link></li>
              <li><Link href="/contact" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors">Corporate Support</Link></li>
              <li><Link href="/terms" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors">Legal Terms</Link></li>
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-24 pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">© 2026 ProfessionalsBD.</p>
        <div className="flex gap-8">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure TLS 1.3</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ISO 27001 Certified</span>
        </div>
      </div>
    </footer>
  );
}