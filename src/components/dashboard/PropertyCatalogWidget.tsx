import { Link } from 'react-router-dom';
import { Building2, Plus, ArrowRight, MapPin, Image as ImageIcon, Sparkles } from 'lucide-react';
import { BackendProject } from '../../hooks/useProjects';
import { StatusBadge } from '../ui/StatusBadge';

export interface PropertyCatalogWidgetProps {
  projects: BackendProject[];
  isLoading: boolean;
}

export function PropertyCatalogWidget({ projects = [], isLoading }: PropertyCatalogWidgetProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-[#EDF0F2]">
          <div className="h-6 w-48 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-8 w-28 bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-50 border border-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const displayedProjects = projects.slice(0, 4);

  return (
    <div className="rounded-2xl bg-white border border-[#EDF0F2] p-6 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-5">
      {/* 1. Header with Title, Count Badge, and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EDF0F2]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0 border border-[#10B981]/20">
            <Building2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#1F2937]">Property Catalog &amp; Inventory</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-[#475569]">
                {projects.length} {projects.length === 1 ? 'Property' : 'Properties'}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Manage client real estate projects, upload property pictures, and configure units
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/projects"
            className="text-xs font-semibold text-[#10B981] hover:text-[#059669] inline-flex items-center gap-1 transition-colors px-2 py-1"
          >
            <span>All Properties</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/projects/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs active:scale-[0.98] transition-all"
            title="Create a new property project and upload photos"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Property</span>
          </Link>
        </div>
      </div>

      {/* 2. Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <div className="py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center flex flex-col items-center justify-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
            <Building2 className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-bold text-[#1F2937]">No Properties in Catalog Yet</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Add your client&apos;s project details, location, pricing, and site photos to launch AI marketing creatives and track lead conversions.
            </p>
          </div>
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create First Property</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedProjects.map((p) => {
            const city = p.location?.city || p.city || 'Gurugram';
            const price = p.priceRange?.display || p.priceDisplay || (p.price ? `₹${p.price}` : 'Price on Request');

            return (
              <div
                key={p._id}
                className="group rounded-xl border border-[#EDF0F2] bg-white overflow-hidden hover:border-[#10B981]/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Project Image Banner */}
                <div className="relative h-32 w-full bg-slate-900 overflow-hidden">
                  {p.coverImageUrl ? (
                    <img
                      src={p.coverImageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-3 text-center">
                      <Building2 className="w-7 h-7 text-[#10B981]/70 mb-1" />
                      <span className="text-[10px] text-slate-400 font-medium">No cover image uploaded</span>
                    </div>
                  )}

                  {/* Gradient Overlay & Badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/90 text-[#1F2937] backdrop-blur-xs uppercase tracking-wider">
                        {p.category || 'RESIDENTIAL'}
                      </span>
                      <StatusBadge status={p.status || 'ACTIVE'} />
                    </div>

                    <div className="text-white">
                      <span className="text-[10px] font-semibold text-emerald-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span className="truncate">{city}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#1F2937] truncate group-hover:text-[#10B981] transition-colors" title={p.name}>
                      {p.name}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-1">
                      <span className="font-semibold text-[#1F2937] truncate">{price}</span>
                      {p.totalUnits ? (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {p.totalUnits} Units
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Inventory</span>
                      )}
                    </div>
                  </div>

                  {/* Card Action Links */}
                  <div className="pt-2 border-t border-[#EDF0F2] flex items-center justify-between gap-2">
                    <Link
                      to={`/projects/${p._id}`}
                      className="flex-1 text-center py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-[#E8F7F1] hover:text-[#10B981] text-[11px] font-semibold text-[#475569] transition-all inline-flex items-center justify-center gap-1"
                      title="Upload photos and edit project details"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Photos &amp; Info</span>
                    </Link>

                    <Link
                      to="/studio"
                      className="py-1.5 px-2.5 rounded-lg border border-[#EDF0F2] hover:bg-slate-50 text-[11px] font-semibold text-[#64748B] hover:text-[#1F2937] transition-all inline-flex items-center gap-1"
                      title="Generate AI ads and marketing reels"
                    >
                      <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
                      <span>Ads</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
