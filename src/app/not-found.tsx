import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-md">
        <div className="font-heading text-7xl font-bold text-surface-100 mb-4">
          404
        </div>
        <h1 className="font-heading text-2xl font-bold text-surface-900 mb-3">
          Page not found
        </h1>
        <p className="text-surface-500 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="primary">
              <Home className="h-4 w-4 mr-2" />
              Go home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
