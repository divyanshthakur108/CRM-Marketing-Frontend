import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import { Menu as MenuIcon, Bell, Building2, Settings, Check } from 'lucide-react';

import { useAuthStore } from '../../store/useAuthStore';
import { getBreadcrumbFromPathname } from './navConfig';
import { realCrmColors } from '../../theme';

export interface TopbarProps {
  unreadCount?: number;
  onOpenMobileDrawer: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
}

export function Topbar({
  unreadCount = 0,
  onOpenMobileDrawer,
}: TopbarProps) {
  const location = useLocation();
  const { user, organizations, switchOrganization } = useAuthStore();
  const breadcrumb = getBreadcrumbFromPathname(location.pathname, user);

  // Organization Switcher Menu State
  const [orgMenuAnchor, setOrgMenuAnchor] = useState<null | HTMLElement>(null);
  const isOrgMenuOpen = Boolean(orgMenuAnchor);

  const handleOpenOrgMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (organizations && organizations.length > 1) {
      setOrgMenuAnchor(event.currentTarget);
    }
  };

  const handleCloseOrgMenu = () => {
    setOrgMenuAnchor(null);
  };

  const handleSelectOrg = async (orgId: string) => {
    handleCloseOrgMenu();
    if (orgId !== user?.organizationId) {
      await switchOrganization(orgId);
    }
  };

  const isNotificationsActive = location.pathname.startsWith('/notifications');

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: realCrmColors.background,
        borderBottom: `1px solid ${realCrmColors.cardBorder}`,
        color: realCrmColors.primaryText,
        zIndex: (theme) => theme.zIndex.drawer - 1, // Below modal & mobile drawer
        transition: 'none',
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          height: 64,
          minHeight: 64,
          px: { xs: 2, sm: 3, lg: 4 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* ========================================================= */}
        {/* 1. LEFT SECTION: Hamburger (<1024px) + Monogram + Breadcrumb */}
        {/* ========================================================= */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flexShrink: 1 }}>
          {/* Mobile Hamburger Button (<1024px) */}
          <IconButton
            onClick={onOpenMobileDrawer}
            size="small"
            aria-label="Open mobile navigation"
            sx={{
              display: { xs: 'flex', lg: 'none' },
              p: 1,
              borderRadius: '6px',
              color: realCrmColors.secondaryText,
              '&:hover': {
                backgroundColor: realCrmColors.secondaryBackground,
                color: realCrmColors.primaryText,
              },
            }}
          >
            <MenuIcon size={20} />
          </IconButton>

          {/* Mobile Brand Monogram (<1024px) */}
          <Box
            sx={{
              display: { xs: 'flex', lg: 'none' },
              width: 28,
              height: 28,
              borderRadius: '6px',
              backgroundColor: realCrmColors.primary,
              color: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
              flexShrink: 0,
            }}
          >
            RC
          </Box>

          {/* Breadcrumb Navigation Hierarchy */}
          <Breadcrumbs
            separator={
              <Typography sx={{ color: '#CBD5E1', fontSize: '0.875rem', mx: 0.25, userSelect: 'none' }}>
                /
              </Typography>
            }
            aria-label="Breadcrumb Navigation"
            sx={{
              minWidth: 0,
              '& .MuiBreadcrumbs-ol': {
                flexWrap: 'nowrap',
                alignItems: 'center',
              },
            }}
          >
            {breadcrumb.groupLabel && (
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: realCrmColors.secondaryText,
                  fontWeight: 500,
                  display: { xs: 'none', sm: 'inline-block' },
                  whiteSpace: 'nowrap',
                }}
              >
                {breadcrumb.groupLabel}
              </Typography>
            )}
            <Typography
              sx={{
                fontSize: { xs: '0.9375rem', sm: '1rem' },
                fontWeight: 600,
                color: realCrmColors.primaryText,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {breadcrumb.itemLabel}
            </Typography>
          </Breadcrumbs>
        </Box>

        {/* ========================================================= */}
        {/* 2. CENTER SECTION: Balanced Space (Preserved without fake search) */}
        {/* ========================================================= */}
        <Box sx={{ flex: 1 }} />

        {/* ========================================================= */}
        {/* 3. RIGHT SECTION: Org Context + Plan + Notifications + Settings */}
        {/* ========================================================= */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flexShrink: 0 }}>
          {/* Organization Context Badge / Switcher (Tablet & Desktop) */}
          {user?.organizationName && (
            <Tooltip
              title={
                organizations && organizations.length > 1
                  ? 'Switch Organization'
                  : `Active Workspace: ${user.organizationName}`
              }
              arrow
            >
              <Chip
                icon={<Building2 size={14} color={realCrmColors.secondaryText} />}
                label={user.organizationName}
                size="small"
                onClick={organizations && organizations.length > 1 ? handleOpenOrgMenu : undefined}
                sx={{
                  display: { xs: 'none', md: 'inline-flex' },
                  height: 30,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  backgroundColor: realCrmColors.secondaryBackground,
                  border: `1px solid ${realCrmColors.cardBorder}`,
                  color: realCrmColors.primaryText,
                  cursor: organizations && organizations.length > 1 ? 'pointer' : 'default',
                  transition: 'background-color 150ms ease-in-out',
                  '&:hover': {
                    backgroundColor:
                      organizations && organizations.length > 1
                        ? '#EDF0F2'
                        : realCrmColors.secondaryBackground,
                  },
                  '& .MuiChip-icon': {
                    ml: 0.75,
                    mr: -0.25,
                  },
                }}
              />
            </Tooltip>
          )}


          {/* Notification Bell with Dynamic Unread Badge */}
          <Tooltip
            title={
              unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'Notifications'
            }
            arrow
          >
            <IconButton
              component={Link}
              to="/notifications"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              sx={{
                p: 1,
                borderRadius: '8px',
                color: isNotificationsActive ? realCrmColors.primary : realCrmColors.secondaryText,
                backgroundColor: isNotificationsActive ? realCrmColors.activeNavigation : 'transparent',
                transition: 'background-color 150ms ease-in-out, color 150ms ease-in-out',
                '&:hover': {
                  backgroundColor: isNotificationsActive
                    ? realCrmColors.activeNavigation
                    : realCrmColors.secondaryBackground,
                  color: isNotificationsActive ? realCrmColors.primary : realCrmColors.primaryText,
                },
              }}
            >
              <Badge
                badgeContent={unreadCount > 9 ? '9+' : unreadCount}
                color="error"
                invisible={unreadCount === 0}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6875rem',
                    height: 18,
                    minWidth: 18,
                    px: 0.5,
                    fontWeight: 700,
                    backgroundColor: realCrmColors.error,
                    color: '#FFFFFF',
                  },
                }}
              >
                <Bell size={20} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Desktop Settings Shortcut Icon */}
          <Tooltip title="Workspace Settings" arrow>
            <IconButton
              component={Link}
              to="/settings"
              aria-label="Workspace Settings"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                p: 1,
                borderRadius: '8px',
                color: location.pathname.startsWith('/settings')
                  ? realCrmColors.primary
                  : realCrmColors.secondaryText,
                backgroundColor: location.pathname.startsWith('/settings')
                  ? realCrmColors.activeNavigation
                  : 'transparent',
                transition: 'background-color 150ms ease-in-out, color 150ms ease-in-out',
                '&:hover': {
                  backgroundColor: location.pathname.startsWith('/settings')
                    ? realCrmColors.activeNavigation
                    : realCrmColors.secondaryBackground,
                  color: location.pathname.startsWith('/settings')
                    ? realCrmColors.primary
                    : realCrmColors.primaryText,
                },
              }}
            >
              <Settings size={20} />
            </IconButton>
          </Tooltip>

          {/* Mobile Profile Avatar Link (<1024px) */}
          <Tooltip title={user?.name || 'Account Settings'} arrow>
            <IconButton
              component={Link}
              to="/settings"
              aria-label="Account Settings"
              sx={{
                display: { xs: 'inline-flex', lg: 'none' },
                p: 0.5,
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: realCrmColors.primary,
                  color: '#FFFFFF',
                }}
              >
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RC'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Organization Switcher Dropdown (If member of multiple orgs) */}
      {organizations && organizations.length > 1 && (
        <Menu
          anchorEl={orgMenuAnchor}
          open={isOrgMenuOpen}
          onClose={handleCloseOrgMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          slotProps={{
            paper: {
              sx: {
                width: 240,
                borderRadius: '10px',
                border: `1px solid ${realCrmColors.cardBorder}`,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
                p: 1,
                mt: 1,
              },
            },
          }}
        >
          <Box sx={{ px: 1.5, py: 0.75 }}>
            <Typography variant="overline" sx={{ color: realCrmColors.secondaryText, fontWeight: 600 }}>
              Switch Organization
            </Typography>
          </Box>
          <Divider sx={{ my: 0.5, borderColor: realCrmColors.cardBorder }} />
          {organizations.map((org) => {
            const isSelected = org.id === user?.organizationId;
            return (
              <MenuItem
                key={org.id}
                onClick={() => handleSelectOrg(org.id)}
                selected={isSelected}
                sx={{
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                  px: 1.5,
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? realCrmColors.primary : realCrmColors.primaryText,
                    }}
                  >
                    {org.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: realCrmColors.secondaryText, display: 'block' }}>
                    {org.role ? org.role.replace('_', ' ') : 'Member'}
                  </Typography>
                </Box>
                {isSelected && <Check size={16} color={realCrmColors.primary} />}
              </MenuItem>
            );
          })}
        </Menu>
      )}
    </AppBar>
  );
}
