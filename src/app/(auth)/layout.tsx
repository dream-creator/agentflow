import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgentFlow — Sign in",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-50">
      <main className="w-full max-w-[380px]">{children}</main>
    </div>
  );
}
