import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { RoleGate } from '../components/RoleGate';
import { useToast } from '../components/ui/Toast';
import { useAuthStore } from '../store/useAuthStore';
import {
  Users,
  UserPlus,
  Mail,
} from 'lucide-react';

interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedProjects: string[];
  status: string;
}

export function TeamPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();

  const members: TeamMemberItem[] = user
    ? [
        {
          id: user.id,
          name: user.name || 'Workspace Administrator',
          email: user.email,
          role: user.role === 'org_owner' ? 'OWNER' : (user.role || 'OWNER').toUpperCase(),
          assignedProjects: ['All active organization projects'],
          status: 'ACTIVE',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Team members & permissions"
        description="Manage organization members, assign role permissions, and configure access policies."
        actions={
          <RoleGate
            action="manage:team"
            fallback={
              <StatusBadge status="ACTIVE" label="Role: Read-only access" />
            }
          >
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() =>
                toast({
                  title: 'Invite Dispatched',
                  message: 'Send workspace invitation to team members from Workspace Settings.',
                  type: 'info',
                })
              }
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Invite member
            </Button>
          </RoleGate>
        }
      />

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#0A0A0A]" />
            <span>Organization members ({members.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-[#E5E5E5] rounded-[8px] overflow-x-auto bg-white">
            <table className="w-full text-left text-[14px] border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E5E5] text-[12px] font-medium text-[#737373]">
                  <th className="p-3.5">Team member</th>
                  <th className="p-3.5">Assigned role</th>
                  <th className="p-3.5">Permission level</th>
                  <th className="p-3.5">Project scopes</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-[#F5F5F5] transition-colors h-12">
                    <td className="p-3.5">
                      <div className="font-medium text-[#0A0A0A]">{member.name}</div>
                      <div className="text-[12px] text-[#737373] flex items-center mt-0.5">
                        <Mail className="w-3.5 h-3.5 mr-1 text-[#737373]" />
                        {member.email}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <StatusBadge
                        status={member.role === 'OWNER' ? 'ACTIVE' : 'DRAFT'}
                        label={member.role.replace('_', ' ')}
                      />
                    </td>

                    <td className="p-3.5 text-[13px] text-[#525252]">
                      {member.role === 'OWNER' && 'Full root administration'}
                      {member.role === 'MARKETING_MANAGER' && 'Planning, approvals, & ad spend'}
                      {member.role === 'SALES_AGENT' && 'Leads CRM & inbound messaging'}
                      {member.role === 'CREATIVE_EDITOR' && 'AI Creative Studio & renders'}
                    </td>

                    <td className="p-3.5 text-[13px] text-[#525252]">
                      {member.assignedProjects.join(', ')}
                    </td>

                    <td className="p-3.5">
                      <StatusBadge status={member.status} />
                    </td>

                    <td className="p-3.5 text-right">
                      <RoleGate action="manage:team">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toast({
                              title: 'Permissions verified',
                              message: `Primary administrator credentials for ${member.name}`,
                              type: 'info',
                            })
                          }
                        >
                          View details
                        </Button>
                      </RoleGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
