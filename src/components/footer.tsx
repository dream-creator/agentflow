import Link from "next/link";
import { Mail, Globe, Home } from "lucide-react";
import { footerLinks } from "@/lib/footer-data";

const currentYear = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-surface-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Top section: Logo + Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="h-4 w-4 text-white" />
              </div>
              <span className="font-heading text-lg font-bold text-surface-900">
                AgentFlow
              </span>
            </Link>
            <p className="text-sm text-surface-500 max-w-[220px] leading-relaxed">
              The CRM for agents who hate CRMs.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-heading font-semibold text-surface-900 text-sm mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-surface-500 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-heading font-semibold text-surface-900 text-sm mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-surface-500 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-heading font-semibold text-surface-900 text-sm mb-4">
              Connect
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:support@agentflow.app"
                  className="flex items-center gap-2 text-sm text-surface-500 hover:text-primary transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  support@agentflow.app
                </a>
              </li>
              <li>
                <a
                  href="https://agentflow.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-surface-500 hover:text-primary transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  agentflow.app
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section: Copyright */}
        <div className="pt-8 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-400">
            &copy; {currentYear} AgentFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-surface-400 hover:text-surface-600 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-surface-400 hover:text-surface-600 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
