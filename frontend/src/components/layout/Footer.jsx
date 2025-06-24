export default function Footer() {
  return (
<footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-indigo-800 mb-4">SADA9A</h3>
              <p className="text-gray-600">Making a difference through collective efforts.</p>
            </div>
            <div>
              <h4 className="text-md font-medium text-indigo-800 mb-4">About Us</h4>
              <ul className="space-y-2">
                <li><a href="/about" className="text-gray-600 hover:text-teal-600">Our Story</a></li>
                <li><a href="/team" className="text-gray-600 hover:text-teal-600">Team</a></li>
                <li><a href="/careers" className="text-gray-600 hover:text-teal-600">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-medium text-indigo-800 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="/faq" className="text-gray-600 hover:text-teal-600">FAQ</a></li>
                <li><a href="/blog" className="text-gray-600 hover:text-teal-600">Blog</a></li>
                <li><a href="/support" className="text-gray-600 hover:text-teal-600">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-medium text-indigo-800 mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><a href="/contact" className="text-gray-600 hover:text-teal-600">Contact Us</a></li>
                <li><a href="https://twitter.com" className="text-gray-600 hover:text-teal-600">Twitter</a></li>
                <li><a href="https://facebook.com" className="text-gray-600 hover:text-teal-600">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} SADA9A. All rights reserved.
          </div>
        </div>
      </footer>
  );
}