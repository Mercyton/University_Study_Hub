import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section: Info & Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Company Info */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-4">LearnLoop</h3>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Access university study material, preview sample papers, and unlock full past papers after subscription.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/demo" className="hover:text-lime-400 transition-colors">Demo</Link></li>
              <li><Link href="/login" className="hover:text-lime-400 transition-colors">Login</Link></li>
              <li><Link href="/register" className="hover:text-lime-400 transition-colors">Register</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-lime-400 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-lime-400 transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-lime-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section: Copyright */}
        <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          <p>&copy; {currentYear} Wanji Technologies. All rights reserved.</p>
        </div>
        
      </div>
    </footer>
  );
}