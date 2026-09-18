import NewsletterForm from "./NewsletterForm";

export default function Footer() {
  return (
    <footer className="border-t border-current/10">
      <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-10">
        <div>
          <p className="font-display text-lg mb-3">
            Grow with <span className="italic text-accent">Akintola Samuel</span>
          </p>
          <p className="text-sm text-stone dark:text-stone-light max-w-xs mb-5">
            A quiet online space for spiritual growth, biblical learning, and
            personal mentoring.
          </p>
          <p className="text-sm font-medium mb-2">Get occasional updates</p>
          <NewsletterForm />
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Quick links</p>
          <ul className="space-y-2 text-sm text-stone dark:text-stone-light">
            <li><a href="#" className="hover:text-accent transition-colors">Home</a></li>
            <li><a href="#courses" className="hover:text-accent transition-colors">Courses</a></li>
            <li><a href="#journal" className="hover:text-accent transition-colors">Study Notes</a></li>
            <li><a href="#philosophy" className="hover:text-accent transition-colors">Philosophy</a></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Help &amp; support</p>
          <ul className="space-y-2 text-sm text-stone dark:text-stone-light">
            <li><a href="#" className="hover:text-accent transition-colors">Contact us</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Privacy policy</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Terms of service</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-current/10 py-6">
        <p className="text-xs text-center text-stone dark:text-stone-light">
          © {new Date().getFullYear()} Grow with Akintola Samuel. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
