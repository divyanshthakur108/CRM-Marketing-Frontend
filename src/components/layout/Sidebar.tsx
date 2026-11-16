import { Link, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useAuthStore } from '../../store/useAuthStore';
import { getVisibleNavGroups } from './navConfig';
import { UserMenu } from './UserMenu';
import { realCrmColors } from '../../theme';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  unreadCount?: number;
  onLogout: () => Promise<void>;
}

// Minimal Dashboard Standard Widths
export const SIDEBAR_WIDTH_EXPANDED = 280;
export const SIDEBAR_WIDTH_COLLAPSED = 76;

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  unreadCount = 0,
  onLogout,
}: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const visibleGroups = getVisibleNavGroups(user);
  const isPlatformAdmin = Boolean(user?.isPlatformAdmin || user?.role === 'platform_admin');

  const currentWidth = isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <Drawer
      variant="permanent"
      aria-label="Sidebar Navigation"
      sx={{
        display: { xs: 'none', lg: 'block' },
        width: currentWidth,
        flexShrink: 0,
        zIndex: (theme) => theme.zIndex.drawer,
        transition: (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          backgroundColor: realCrmColors.background,
          borderRight: `1px solid ${realCrmColors.cardBorder}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowX: 'hidden',
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        },
      }}
    >
      {/* 1. Header: RealCRM Brand + Dynamic Subtitle + Collapse Toggle */}
      <Box
        sx={{
          height: 64,
          px: 2.25,
          borderBottom: `1px solid ${realCrmColors.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          backgroundColor: realCrmColors.background,
        }
      }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
          {/* Logo Monogram */}
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              backgroundColor: realCrmColors.primary,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9375rem',
              letterSpacing: '0.04em',
              flexShrink: 0,
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
            }}
          >
            RC
          </Box>

          {/* Branding text (Hidden on collapse) */}
          {!isCollapsed && (
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: 700,
                  color: realCrmColors.primaryText,
                  lineHeight: 1.25,
                  fontSize: '0.9375rem',
                  letterSpacing: '-0.01em',
                }}
              >
                RealCRM
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  display: 'block',
                  color: realCrmColors.secondaryText,
                  fontSize: '0.6875rem',
                  lineHeight: 1.3,
                  fontWeight: 500,
                }}
                title={isPlatformAdmin ? 'Platform Administration' : (user?.organizationName || 'Workspace')}
              >
                {isPlatformAdmin ? 'Platform Administration' : (user?.organizationName || 'Workspace')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Collapse / Expand Toggle Button */}
        <IconButton
          onClick={onToggleCollapse}
          size="small"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          sx={{
            p: 0.75,
            borderRadius: '8px',
            color: realCrmColors.secondaryText,
            '&:hover': {
              backgroundColor: realCrmColors.secondaryBackground,
              color: realCrmColors.primaryText,
            },
            flexShrink: 0,
          }}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </IconButton>
      </Box>

      {/* 2. Grouped Navigation Items List */}
      <Box
        component="nav"
        aria-label="Sidebar Primary Navigation"
        sx={{
          flex: 1,
          p: isCollapsed ? 1.25 : 2,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {visibleGroups.map((group) => (
          <Box key={group.label} sx={{ mb: 2.5 }}>
            {/* Section Header */}
            {!isCollapsed ? (
              <Typography
                variant="overline"
                component="h3"
                sx={{
                  display: 'block',
                  px: 1.75,
                  py: 0.75,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: realCrmColors.secondaryText,
                  userSelect: 'none',
                }}
              >
                {group.label}
              </Typography>
            ) : (
              <Divider sx={{ my: 1.25, borderColor: realCrmColors.cardBorder }} />
            )}

            <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
              {group.items.map((item) => {
                const active = item.isActive(location.pathname);
                const Icon = item.icon;
                const isNotifications = item.badgeKey === 'notifications';

                const buttonContent = (
                  <ListItemButton
                    component={Link}
                    to={item.href}
                    aria-current={active ? 'page' : undefined}
                    aria-label={item.name}
                    sx={{
                      minHeight: 44,
                      borderRadius: '10px',
                      px: isCollapsed ? 0 : 2,
                      py: 1,
                      justifyContent: isCollapsed ? 'center' : 'initial',
                      backgroundColor: active ? realCrmColors.activeNavigation : 'transparent',
                      color: active ? realCrmColors.primary : realCrmColors.primaryText,
                      transition: 'background-color 150ms ease-in-out, color 150ms ease-in-out',
                      position: 'relative',
                      '&:hover': {
                        backgroundColor: active
                          ? realCrmColors.activeNavigation
                          : realCrmColors.secondaryBackground,
                        color: active ? realCrmColors.primary : realCrmColors.primaryText,
                      },
                    }}
                  >
                    {/* Item Icon */}
                    <ListItemIcon
                      sx={{
                        minWidth: isCollapsed ? 0 : 34,
                        mr: isCollapsed ? 0 : 1.25,
                        justifyContent: 'center',
                        color: active ? realCrmColors.primary : realCrmColors.secondaryText,
                        transition: 'color 150ms ease-in-out',
                      }}
                    >
                      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Icon size={20} />
                        {/* Collapsed notification indicator dot */}
                        {isCollapsed && isNotifications && unreadCount > 0 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: -2,
                              right: -2,
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: realCrmColors.error,
                              border: `2px solid ${realCrmColors.background}`,
                            }}
                          />
                        )}
                      </Box>
                    </ListItemIcon>

                    {/* Item Label (Expanded view only) */}
                    {!isCollapsed && (
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: active ? 600 : 500,
                          color: active ? realCrmColors.primary : realCrmColors.primaryText,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1,
                          textAlign: 'left',
                        }}
                      >
                        {item.name}
                      </Typography>
                    )}

                    {/* Notification Count Badge (Expanded view) */}
                    {!isCollapsed && isNotifications && unreadCount > 0 && (
                      <Box
                        sx={{
                          ml: 'auto',
                          minWidth: 20,
                          height: 20,
                          px: 0.75,
                          borderRadius: '10px',
                          backgroundColor: realCrmColors.error,
                          color: '#FFFFFF',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Box>
                    )}
                  </ListItemButton>
                );

                return (
                  <ListItem key={item.name} disablePadding sx={{ display: 'block' }}>
                    {isCollapsed ? (
                      <Tooltip title={item.name} placement="right" arrow>
                        {buttonContent}
                      </Tooltip>
                    ) : (
                      buttonContent
                    )}
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* 3. Bottom User Profile Section */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${realCrmColors.cardBorder}`,
          backgroundColor: realCrmColors.background,
          flexShrink: 0,
        }}
      >
        <UserMenu compact={isCollapsed} onLogout={onLogout} />
      </Box>
    </Drawer>
  );
}
