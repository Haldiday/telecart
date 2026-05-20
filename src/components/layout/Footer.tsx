import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 md:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-4 text-sm">Help & Support</h4>
            <ul className="space-y-2">
              <li><Link to="/contact" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Contact Us</Link></li>
              <li><Link to="/faqs" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">About Us</Link></li>
              <li><Link to="/privacy-policy" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-sm opacity-60 hover:opacity-100 transition-opacity hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">B</span>
            </div>
            <span className="text-lg font-bold">BizReq</span>
          </div>
          <p className="text-sm opacity-50">© {new Date().getFullYear()} BizReq. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Twitter</a>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">LinkedIn</a>
            <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Facebook</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
