import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import ButtonBase from '@mui/material/ButtonBase';
import { Settings, Users, Shield, Clapperboard, LogOut, ChevronDown } from 'lucide-react';

import { useAuthStore } from '../../store/useAuthStore';
import { realCrmColors } from '../../theme';

export interface UserMenuProps {
  compact?: boolean;
  onLogout: () => Promise<void>;
}

export function UserMenu({ compact = false, onLogout }: UserMenuProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isPlatformAdmin = Boolean(user?.isPlatformAdmin || user?.role === 'platform_admin');

  // Trigger button content
  const trigger = (
    <ButtonBase
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="true"
      aria-label="User navigation menu"
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: compact ? 'center' : 'space-between',
        gap: 1.5,
        p: 1,
        borderRadius: '8px',
        textAlign: 'left',
        transition: 'background-color 150ms ease-in-out',
        '&:hover': {
          backgroundColor: realCrmColors.secondaryBackground,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        {/* Avatar with Online Status Indicator */}
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: realCrmColors.primary,
              color: '#FFFFFF',
            }}
          >
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RC'}
          </Avatar>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 9,
              height: 9,
              borderRadius: '50%',
              backgroundColor: realCrmColors.success,
              border: `2px solid ${realCrmColors.background}`,
            }}
          />
        </Box>

        {/* User Info (Expanded only) */}
        {!compact && (
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{ fontWeight: 600, color: realCrmColors.primaryText, lineHeight: 1.2 }}
            >
              {user?.name || 'Authorized Member'}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ display: 'block', color: realCrmColors.secondaryText, fontSize: '0.6875rem' }}
            >
              {user?.email || 'user@realcrm.in'}
            </Typography>
          </Box>
        )}
      </Box>

      {!compact && <ChevronDown size={16} color={realCrmColors.secondaryText} />}
    </ButtonBase>
  );

  return (
    <>
      {compact ? (
        <Tooltip title={user?.name || 'User Profile'} placement="right" arrow>
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}

      {/* Profile Popup Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              width: 260,
              borderRadius: '12px',
              border: `1px solid ${realCrmColors.cardBorder}`,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
              p: 1,
              mt: -1,
            },
          },
        }}
      >
        {/* Header Section */}
        <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
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
              variant="body2"
              noWrap
              sx={{ fontWeight: 600, color: realCrmColors.primaryText }}
            >
              {user?.name || 'Authorized Member'}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ display: 'block', color: realCrmColors.secondaryText, fontSize: '0.6875rem' }}
            >
              {user?.email || 'user@realcrm.in'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
              <Chip
                label={user?.role ? user.role.replace('_', ' ') : 'Member'}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  backgroundColor: realCrmColors.secondaryBackground,
                  color: realCrmColors.secondaryText,
                  textTransform: 'capitalize',
                }}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 1, borderColor: realCrmColors.cardBorder }} />

        {/* Quick Links */}
        <MenuItem
          component={Link}
          to="/settings"
          onClick={handleClose}
          sx={{
            borderRadius: '6px',
            fontSize: '0.875rem',
            color: realCrmColors.primaryText,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 1,
          }}
        >
          <Settings size={16} color={realCrmColors.secondaryText} />
          <span>Workspace Settings</span>
        </MenuItem>

        <MenuItem
          component={Link}
          to="/team"
          onClick={handleClose}
          sx={{
            borderRadius: '6px',
            fontSize: '0.875rem',
            color: realCrmColors.primaryText,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 1,
          }}
        >
          <Users size={16} color={realCrmColors.secondaryText} />
          <span>Team &amp; Roles</span>
        </MenuItem>

        {isPlatformAdmin && (
          <>
            <MenuItem
              component={Link}
              to="/admin/organizations"
              onClick={handleClose}
              sx={{
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: realCrmColors.primaryText,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1,
              }}
            >
              <Shield size={16} color={realCrmColors.secondaryText} />
              <span>Admin Console</span>
            </MenuItem>

            <MenuItem
              component={Link}
              to="/admin/video-lab"
              onClick={handleClose}
              sx={{
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: realCrmColors.primaryText,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1,
              }}
            >
              <Clapperboard size={16} color={realCrmColors.secondaryText} />
              <span>Video Lab</span>
            </MenuItem>
          </>
        )}

        <Divider sx={{ my: 1, borderColor: realCrmColors.cardBorder }} />

        {/* Logout action */}
        {isAuthenticated || user ? (
          <MenuItem
            onClick={async () => {
              handleClose();
              await onLogout();
            }}
            sx={{
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: realCrmColors.error,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 1,
              '&:hover': {
                backgroundColor: '#FEF2F2',
                color: realCrmColors.error,
              },
            }}
          >
            <LogOut size={16} color={realCrmColors.error} />
            <span>Log Out</span>
          </MenuItem>
        ) : (
          <MenuItem
            component={Link}
            to="/login"
            onClick={handleClose}
            sx={{
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: realCrmColors.primary,
              py: 1,
            }}
          >
            <span>Log In</span>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
