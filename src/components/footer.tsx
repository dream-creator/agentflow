import Link from "next/link";
import { Mail, Globe } from "lucide-react";
import { footerLinks } from "@/lib/footer-data";

const currentYear = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-surface-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Top section: Logo + Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">AF</span>
              </div>
              <span className="font-heading text-lg font-bold text-surface-900">
                AgentFlow
              </span>
            </Link>
            <p className="text-sm text-surface-500 max-w-[200px]">
              The CRM for agents who hate CRMs.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-heading font-semibold text-surface-900 text-sm mb-4">
              Product
            </h3>
            <ul className="space-y-2.5">
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
            <ul className="space-y-2.5">
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
        </div>

        {/* Bottom section: Copyright + Contact */}
        <div className="pt-8 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-400">
            &copy; {currentYear} AgentFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="mailto:support@agentflow@gmail.com"
              className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-primary transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              support@agentflow@gmail.com
            </a>
            <a
              href="https://agentflow.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-primary transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              agentflow.app
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
