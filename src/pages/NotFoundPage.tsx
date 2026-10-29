import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
      <div className="border border-[#E5E5E5] rounded-[10px] p-8 sm:p-12 max-w-md w-full bg-white shadow-card">
        <span className="text-[12px] font-medium text-[#737373] block mb-3">
          Error 404
        </span>
        <h1 className="text-[28px] font-semibold tracking-tight text-[#0A0A0A] mb-2">
          Page not found
        </h1>
        <p className="text-[14px] text-[#525252] mb-6">
          The requested page could not be found within the workspace console.
        </p>
        <Link to="/dashboard">
          <Button variant="primary" size="md" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
            Return to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
