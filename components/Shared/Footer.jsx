import Link from "next/link";

const Footer = () => {
  return (
    <footer className="hidden md:block bg-brand-section border-t border-color py-10 mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h2 className="text-brand-primary font-black text-xl mb-3 uppercase tracking-tighter">
            GrowEasy
          </h2>
          <p className="text-gray-500 text-sm font-medium">
            Efficient business management tools for the modern entrepreneur.
          </p>
        </div>

        {/* --- All 'to' props changed to 'href' below --- */}
        <div>
          <h3 className="font-bold text-brand-dark mb-3 uppercase text-xs tracking-widest">
            Features
          </h3>
          <ul className="text-sm text-gray-600 space-y-2 font-medium">
            <li>
              <Link
                href="/invoices"
                className="hover:text-brand-primary transition-colors"
              >
                Invoicing
              </Link>
            </li>
            <li>
              <Link
                href="/finance"
                className="hover:text-brand-primary transition-colors"
              >
                Finances
              </Link>
            </li>
            <li>
              <Link
                href="/inventory"
                className="hover:text-brand-primary transition-colors"
              >
                Inventory
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-brand-dark mb-3 uppercase text-xs tracking-widest">
            Resources
          </h3>
          <ul className="text-sm text-gray-600 space-y-2 font-medium">
            <li>
              <Link
                href="/knowledgeBase"
                className="hover:text-brand-primary transition-colors"
              >
                Guides
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="hover:text-brand-primary transition-colors"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="hover:text-brand-primary transition-colors"
              >
                Support
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-brand-dark mb-3 uppercase text-xs tracking-widest">
            Legal
          </h3>
          <ul className="text-sm text-gray-600 space-y-2 font-medium">
            <li>
              <Link
                href="/privacyPolicy"
                className="hover:text-brand-primary transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/termsAndConditions"
                className="hover:text-brand-primary transition-colors"
              >
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-10">
        © {new Date().getFullYear()} GrowEasy. Powered by HIGH-ER ENTERPRISES.
      </div>
    </footer>
  );
};

export default Footer;
