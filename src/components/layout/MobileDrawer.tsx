import { Link, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import { X, Settings, Users, Shield, Clapperboard, LogOut } from 'lucide-react';

import { useAuthStore } from '../../store/useAuthStore';
import { getVisibleNavGroups } from './navConfig';
import { realCrmColors } from '../../theme';

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount?: number;
  onLogout: () => Promise<void>;
}

export const MOBILE_DRAWER_WIDTH = 280;

export function MobileDrawer({
  isOpen,
  onClose,
  unreadCount = 0,
  onLogout,
}: MobileDrawerProps) {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const visibleGroups = getVisibleNavGroups(user);
  const isPlatformAdmin = Boolean(user?.isPlatformAdmin || user?.role === 'platform_admin');

  return (
    <Drawer
      anchor="left"
      open={isOpen}
      onClose={onClose}
      variant="temporary"
      ModalProps={{
        keepMounted: true, // Better mobile opening performance
      }}
      sx={{
        display: { xs: 'block', lg: 'none' },
        '& .MuiDrawer-paper': {
          width: MOBILE_DRAWER_WIDTH,
          maxWidth: '85vw',
          boxSizing: 'border-box',
          backgroundColor: realCrmColors.background,
          borderRight: `1px solid ${realCrmColors.cardBorder}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}
    >
      {/* 1. Header: Branding + Close Button */}
      <Box
        sx={{
          height: 64,
          px: 2,
          borderBottom: `1px solid ${realCrmColors.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              backgroundColor: realCrmColors.primary,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              letterSpacing: '0.05em',
              flexShrink: 0,
            }}
          >
            RC
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle2"
              noWrap
              sx={{ fontWeight: 700, color: realCrmColors.primaryText, lineHeight: 1.2 }}
            >
              RealCRM
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ display: 'block', color: realCrmColors.secondaryText, fontSize: '0.6875rem' }}
            >
              {isPlatformAdmin ? 'Platform Administration' : (user?.organizationName || 'Workspace')}
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close navigation"
          sx={{
            p: 1,
            borderRadius: '6px',
            color: realCrmColors.secondaryText,
            '&:hover': {
              backgroundColor: realCrmColors.secondaryBackground,
              color: realCrmColors.primaryText,
            },
          }}
        >
          <X size={20} />
        </IconButton>
      </Box>

      {/* 2. Grouped Nav List */}
      <Box
        component="nav"
        aria-label="Mobile Grouped Navigation"
        sx={{
          flex: 1,
          p: 1.5,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {visibleGroups.map((group) => (
          <Box key={group.label} sx={{ mb: 2 }}>
            <Typography
              variant="overline"
              component="h3"
              sx={{
                display: 'block',
                px: 1.5,
                py: 0.5,
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: realCrmColors.secondaryText,
                userSelect: 'none',
              }}
            >
              {group.label}
            </Typography>

            <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {group.items.map((item) => {
                const active = item.isActive(location.pathname);
                const Icon = item.icon;
                const isNotifications = item.badgeKey === 'notifications';

                return (
                  <ListItem key={item.name} disablePadding sx={{ display: 'block' }}>
                    <ListItemButton
                      component={Link}
                      to={item.href}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      sx={{
                        minHeight: 44, // Touch-friendly height
                        borderRadius: '8px',
                        px: 1.5,
                        py: 1,
                        backgroundColor: active ? realCrmColors.activeNavigation : 'transparent',
                        color: active ? realCrmColors.primary : realCrmColors.primaryText,
                        '&:hover': {
                          backgroundColor: active
                            ? realCrmColors.activeNavigation
                            : realCrmColors.secondaryBackground,
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 34,
                          color: active ? realCrmColors.primary : realCrmColors.secondaryText,
                        }}
                      >
                        <Icon size={20} />
                      </ListItemIcon>

                      <Typography
                        sx={{
                          fontSize: '0.9375rem',
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

                      {isNotifications && unreadCount > 0 && (
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
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* 3. User Profile & Actions Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${realCrmColors.cardBorder}`,
          backgroundColor: realCrmColors.secondaryBackground,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: realCrmColors.primary,
              color: '#FFFFFF',
            }}
          >
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RC'}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle2"
              noWrap
              sx={{ fontWeight: 600, color: realCrmColors.primaryText, lineHeight: 1.2 }}
            >
              {user?.name || 'Authorized Member'}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ display: 'block', color: realCrmColors.secondaryText, fontSize: '0.75rem' }}
            >
              {user?.email || 'user@realcrm.in'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                label={user?.role ? user.role.replace('_', ' ') : 'Member'}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${realCrmColors.cardBorder}`,
                  color: realCrmColors.secondaryText,
                  textTransform: 'capitalize',
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 0.5 }}>
          <ListItemButton
            component={Link}
            to="/settings"
            onClick={onClose}
            sx={{
              borderRadius: '6px',
              py: 0.75,
              px: 1,
              color: realCrmColors.primaryText,
              '&:hover': { backgroundColor: '#FFFFFF' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 30, color: realCrmColors.secondaryText }}>
              <Settings size={18} />
            </ListItemIcon>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
              Workspace Settings
            </Typography>
          </ListItemButton>

          <ListItemButton
            component={Link}
            to="/team"
            onClick={onClose}
            sx={{
              borderRadius: '6px',
              py: 0.75,
              px: 1,
              color: realCrmColors.primaryText,
              '&:hover': { backgroundColor: '#FFFFFF' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 30, color: realCrmColors.secondaryText }}>
              <Users size={18} />
            </ListItemIcon>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
              Team &amp; Roles
            </Typography>
          </ListItemButton>

          {isPlatformAdmin && (
            <>
              <ListItemButton
                component={Link}
                to="/admin/organizations"
                onClick={onClose}
                sx={{
                  borderRadius: '6px',
                  py: 0.75,
                  px: 1,
                  color: realCrmColors.primaryText,
                  '&:hover': { backgroundColor: '#FFFFFF' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 30, color: realCrmColors.secondaryText }}>
                  <Shield size={18} />
                </ListItemIcon>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Admin Console
                </Typography>
              </ListItemButton>

              <ListItemButton
                component={Link}
                to="/admin/video-lab"
                onClick={onClose}
                sx={{
                  borderRadius: '6px',
                  py: 0.75,
                  px: 1,
                  color: realCrmColors.primaryText,
                  '&:hover': { backgroundColor: '#FFFFFF' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 30, color: realCrmColors.secondaryText }}>
                  <Clapperboard size={18} />
                </ListItemIcon>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Video Lab
                </Typography>
              </ListItemButton>
            </>
          )}

          {/* Logout Action */}
          {isAuthenticated || user ? (
            <ListItemButton
              onClick={async () => {
                onClose();
                await onLogout();
              }}
              sx={{
                borderRadius: '6px',
                py: 0.75,
                px: 1,
                color: realCrmColors.error,
                '&:hover': { backgroundColor: '#FEF2F2' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 30, color: realCrmColors.error }}>
                <LogOut size={18} />
              </ListItemIcon>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: realCrmColors.error }}>
                Log Out
              </Typography>
            </ListItemButton>
          ) : (
            <ListItemButton
              component={Link}
              to="/login"
              onClick={onClose}
              sx={{
                borderRadius: '6px',
                py: 0.75,
                px: 1,
                color: realCrmColors.primary,
                '&:hover': { backgroundColor: realCrmColors.activeNavigation },
              }}
            >
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: realCrmColors.primary }}>
                Log In
              </Typography>
            </ListItemButton>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
