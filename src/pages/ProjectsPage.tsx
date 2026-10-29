import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { formatLocationTitleCase } from '../lib/formatters';
import {
  Search,
  Tag,
  Plus,
  Building,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tagsOnly, setTagsOnly] = useState(false);

  const { data: projects = [], isLoading } = useProjects({
    search: searchTerm,
  });

  const filteredProjects = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return projects;

    return projects.filter((project) => {
      const nameMatch = project.name?.toLowerCase().includes(term);
      const cityMatch = project.city?.toLowerCase().includes(term);
      const subtypeMatch = project.subtype?.toLowerCase().includes(term);
      const addressMatch = project.address?.toLowerCase().includes(term);
      const tagMatch = project.amenities?.some((a) => a.toLowerCase().includes(term));

      if (tagsOnly) {
        return tagMatch;
      }
      return nameMatch || cityMatch || subtypeMatch || addressMatch || tagMatch;
    });
  }, [projects, searchTerm, tagsOnly]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Catalog Projects"
        description="Manage verified real estate inventory, specifications, and rights-consented photography."
        actions={
          <Link to="/projects/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Add Project
            </Button>
          </Link>
        }
      />

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search projects by name, location, amenities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={tagsOnly ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTagsOnly(!tagsOnly)}
            leftIcon={<Tag className="w-3.5 h-3.5" />}
          >
            Tags Only
          </Button>
        </div>
      </div>

      {/* 3. Catalog Projects Grid or Empty State */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
          <span className="text-sm text-text-secondary">Loading catalog inventory...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<Building className="w-12 h-12 text-text-muted" />}
          title="No projects found"
          description={
            searchTerm
              ? 'No projects match your current search query. Try clearing filters.'
              : 'Get started by creating your first catalog project with verified facts and photos.'
          }
          actionLabel="Create Project"
          onAction={() => window.location.assign('/projects/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const displayCity = formatLocationTitleCase(project.city || 'Gurugram');
            const displayAddress = project.address ? `${displayCity}, ${project.address}` : displayCity;

            return (
              <Card key={project.id} className="p-5 flex flex-col justify-between hover:border-neutral-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-meta font-medium tracking-wide uppercase text-text-muted">
                      {project.category || 'Residential'}
                    </span>
                    <StatusBadge status={project.status || 'draft'} />
                  </div>

                  <h3 className="text-section font-semibold text-text-primary line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-meta text-text-secondary mt-1 line-clamp-2">
                    {displayAddress}
                  </p>

                  {/* Amenities Tags */}
                  {project.amenities && project.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {project.amenities.slice(0, 3).map((a, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded-[4px] bg-neutral-100 text-text-secondary"
                        >
                          {a}
                        </span>
                      ))}
                      {project.amenities.length > 3 && (
                        <span className="text-[11px] px-1.5 py-0.5 text-text-muted">
                          +{project.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-meta text-text-muted block">Starting Price</span>
                    <span className="text-sm font-semibold text-text-primary tabular-nums">
                      {project.priceDisplay || 'On Request'}
                    </span>
                  </div>

                  <Link to={`/projects/${project.id}`}>
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Specs
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
