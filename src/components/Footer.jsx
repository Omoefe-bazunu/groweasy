import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="hidden md:block bg-gray-50 border-t border-gray-200 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h2 className="text-[#5247bf] font-bold text-xl mb-3">GrowEasy</h2>
          <p className="text-gray-500 text-sm">
            Efficient business management tools for the modern entrepreneur.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Features</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>
              <Link to="/invoices">Invoicing</Link>
            </li>
            <li>
              <Link to="/financial-records">Finances</Link>
            </li>
            <li>
              <Link to="/inventory">Inventory</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Resources</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>
              <Link to="/knowledge-base">Guides</Link>
            </li>
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/contact">Support</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Legal</h3>
          <ul className="text-sm text-gray-600 space-y-2 cursor-not-allowed opacity-50">
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
          </ul>
        </div>
      </div>
      <div className="text-center text-gray-400 text-xs mt-10">
        © {new Date().getFullYear()} GrowEasy. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
