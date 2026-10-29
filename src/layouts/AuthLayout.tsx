import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] text-[#0A0A0A] flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans antialiased">
      {/* Top Header Placeholder */}
      <div className="w-full h-4 sm:h-8" />

      {/* Centered Auth Card Container */}
      <main className="w-full max-w-[420px] mx-auto my-auto py-4">
        <div className="bg-white border border-[#E5E5E5] rounded-[10px] p-6 sm:p-8 shadow-card">
          <Outlet />
        </div>
      </main>

      {/* Verified Footer */}
      <footer className="w-full text-center py-6 text-[12px] text-[#737373]">
        RealCRM &middot; Real Estate Marketing &amp; Automation Platform
      </footer>
    </div>
  );
}
