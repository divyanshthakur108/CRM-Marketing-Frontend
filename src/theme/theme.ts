import { createTheme, Shadows } from '@mui/material/styles';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

/**
 * RealCRM Design System Tokens
 * Strict enterprise SaaS palette with MUI Minimal Dashboard styling
 */
export const realCrmColors = {
  primary: '#10B981',
  primaryHover: '#059669',
  background: '#FFFFFF',
  secondaryBackground: '#F8FAFC',
  primaryText: '#1F2937',
  secondaryText: '#64748B',
  activeNavigation: '#E8F7F1',
  cardBackground: '#FFFFFF',
  cardBorder: '#EDF0F2',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#EF4444',
  divider: '#EDF0F2',
  disabled: '#94A3B8',
  // MUI Minimal Dashboard pastel tinted accents
  pastel: {
    emerald: '#E8F7F1',
    amber: '#FEF3C7',
    cyan: '#E0F2FE',
    purple: '#EDE9FE',
    rose: '#FEE2E2',
  },
} as const;

/**
 * TypeScript module augmentation for custom palette properties
 */
declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      secondaryBackground: string;
      activeNavigation: string;
      cardBackground: string;
      cardBorder: string;
      primaryHover: string;
      pastel: {
        emerald: string;
        amber: string;
        cyan: string;
        purple: string;
        rose: string;
      };
    };
  }
  interface PaletteOptions {
    custom?: {
      secondaryBackground?: string;
      activeNavigation?: string;
      cardBackground?: string;
      cardBorder?: string;
      primaryHover?: string;
      pastel?: {
        emerald?: string;
        amber?: string;
        cyan?: string;
        purple?: string;
        rose?: string;
      };
    };
  }
}

/**
 * MUI Minimal Dashboard signature 25-level soft diffuse shadow scale
 */
const customShadows: Shadows = [
  'none',
  '0 1px 2px 0 rgba(145, 158, 171, 0.16)',
  '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)', // Minimal Card default shadow
  '0 0 2px 0 rgba(145, 158, 171, 0.24), 0 16px 32px -4px rgba(145, 158, 171, 0.16)', // Minimal Card hover shadow
  '0 0 2px 0 rgba(145, 158, 171, 0.24), -20px 20px 40px -4px rgba(145, 158, 171, 0.24)', // Popover / Dropdown
  '0 0 2px 0 rgba(145, 158, 171, 0.24), -40px 40px 80px -8px rgba(145, 158, 171, 0.24)', // Dialog / Modal soft shadow
  '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
  'none',
  'none',
  'none',
  'none',
  'none',
  'none',
  'none',
  'none',
  'none',
  'none',
  'none',
  'none',
  'none',
  'none',
  'none',
  'none',
  'none',
  'none',
];

/**
 * Centralized RealCRM Material UI (MUI) Theme
 */
export const realCrmTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: realCrmColors.primary,
      dark: realCrmColors.primaryHover,
      light: realCrmColors.activeNavigation,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: realCrmColors.secondaryText,
      light: realCrmColors.secondaryBackground,
      contrastText: '#FFFFFF',
    },
    background: {
      default: realCrmColors.background,
      paper: realCrmColors.cardBackground,
    },
    text: {
      primary: realCrmColors.primaryText,
      secondary: realCrmColors.secondaryText,
      disabled: realCrmColors.disabled,
    },
    divider: realCrmColors.cardBorder,
    success: {
      main: realCrmColors.success,
      light: '#F0FDF4',
      dark: '#15803D',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: realCrmColors.warning,
      light: '#FFFBEB',
      dark: '#B45309',
      contrastText: '#FFFFFF',
    },
    error: {
      main: realCrmColors.error,
      light: '#FEF2F2',
      dark: '#B91C1C',
      contrastText: '#FFFFFF',
    },
    custom: {
      secondaryBackground: realCrmColors.secondaryBackground,
      activeNavigation: realCrmColors.activeNavigation,
      cardBackground: realCrmColors.cardBackground,
      cardBorder: realCrmColors.cardBorder,
      primaryHover: realCrmColors.primaryHover,
      pastel: realCrmColors.pastel,
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2rem', // 32px
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
      color: realCrmColors.primaryText,
    },
    h2: {
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.015em',
      color: realCrmColors.primaryText,
    },
    h3: {
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
      lineHeight: 1.35,
      letterSpacing: '-0.01em',
      color: realCrmColors.primaryText,
    },
    h4: {
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
      lineHeight: 1.4,
      color: realCrmColors.primaryText,
    },
    h5: {
      fontSize: '1rem', // 16px
      fontWeight: 600,
      lineHeight: 1.45,
      color: realCrmColors.primaryText,
    },
    h6: {
      fontSize: '0.875rem', // 14px
      fontWeight: 600,
      lineHeight: 1.5,
      color: realCrmColors.primaryText,
    },
    subtitle1: {
      fontSize: '1rem', // 16px
      fontWeight: 500,
      lineHeight: 1.5,
      color: realCrmColors.secondaryText,
    },
    subtitle2: {
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      lineHeight: 1.5,
      color: realCrmColors.secondaryText,
    },
    body1: {
      fontSize: '0.9375rem', // 15px
      fontWeight: 400,
      lineHeight: 1.55,
      color: realCrmColors.primaryText,
    },
    body2: {
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
      lineHeight: 1.5,
      color: realCrmColors.secondaryText,
    },
    button: {
      fontSize: '0.875rem', // 14px
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem', // 12px
      fontWeight: 400,
      lineHeight: 1.4,
      color: realCrmColors.secondaryText,
    },
    overline: {
      fontSize: '0.6875rem', // 11px
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: realCrmColors.secondaryText,
    },
  },
  shape: {
    borderRadius: 8, // Refined standard control radius
  },
  shadows: customShadows,
  components: {
    // 1. MuiButton: 8px radius, no shadow by default, smooth hover
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        size: 'medium',
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '8px 16px',
          transition: 'background-color 150ms ease-in-out, border-color 150ms ease-in-out, box-shadow 150ms ease-in-out',
        },
        contained: {
          backgroundColor: realCrmColors.primary,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: realCrmColors.primaryHover,
          },
        },
        outlined: {
          borderColor: realCrmColors.cardBorder,
          color: realCrmColors.primaryText,
          '&:hover': {
            backgroundColor: realCrmColors.secondaryBackground,
            borderColor: '#CBD5E1',
          },
        },
        text: {
          color: realCrmColors.primaryText,
          '&:hover': {
            backgroundColor: realCrmColors.secondaryBackground,
          },
        },
      },
    },

    // 2. MuiCard: 16px radius matching Minimal Dashboard, subtle border & soft diffuse shadow
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: realCrmColors.cardBackground,
          border: `1px solid ${realCrmColors.cardBorder}`,
          boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
          overflow: 'hidden',
          transition: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },

    // 3. MuiPaper: 16px radius, clean elevation
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 16,
        },
        outlined: {
          borderColor: realCrmColors.cardBorder,
        },
      },
    },

    // 4. MuiTextField: Outlined small by default
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },

    // 5. MuiOutlinedInput: 8px radius, consistent border & focus states
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          fontSize: '0.875rem',
          '& fieldset': {
            borderColor: realCrmColors.cardBorder,
            transition: 'border-color 150ms ease-in-out',
          },
          '&:hover fieldset': {
            borderColor: '#CBD5E1',
          },
          '&.Mui-focused fieldset': {
            borderColor: realCrmColors.primary,
            borderWidth: '1.5px',
          },
        },
        input: {
          padding: '8.5px 14px',
        },
      },
    },

    // 6. MuiSelect: 8px radius
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },

    // 7. MuiMenuItem: active navigation light green state (#E8F7F1)
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          padding: '8px 14px',
          borderRadius: 6,
          margin: '2px 4px',
          '&:hover': {
            backgroundColor: realCrmColors.secondaryBackground,
          },
          '&.Mui-selected': {
            backgroundColor: realCrmColors.activeNavigation,
            color: realCrmColors.primary,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: realCrmColors.activeNavigation,
            },
          },
        },
      },
    },

    // 8. MuiChip: 8px radius, soft semantic backgrounds
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 24,
        },
        colorSuccess: {
          backgroundColor: '#F0FDF4',
          color: realCrmColors.success,
          border: '1px solid rgba(22, 163, 74, 0.2)',
        },
        colorWarning: {
          backgroundColor: '#FFFBEB',
          color: realCrmColors.warning,
          border: '1px solid rgba(245, 158, 11, 0.2)',
        },
        colorError: {
          backgroundColor: '#FEF2F2',
          color: realCrmColors.error,
          border: '1px solid rgba(239, 68, 68, 0.2)',
        },
      },
    },

    // 9. MuiIconButton: 8px radius, subtle hover
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          color: realCrmColors.secondaryText,
          '&:hover': {
            backgroundColor: realCrmColors.secondaryBackground,
            color: realCrmColors.primaryText,
          },
        },
      },
    },

    // 10. MuiTable: clean borders and layout
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
      },
    },

    // 11. MuiTableHead: #F8FAFC secondary background
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: realCrmColors.secondaryBackground,
        },
      },
    },

    // 12. MuiTableCell: #EDF0F2 dividers, clean padding
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: realCrmColors.cardBorder,
          fontSize: '0.875rem',
          padding: '12px 16px',
        },
        head: {
          color: realCrmColors.secondaryText,
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          backgroundColor: realCrmColors.secondaryBackground,
        },
      },
    },

    // 13. MuiDrawer: #FFFFFF background, #EDF0F2 right border
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: realCrmColors.background,
          borderRight: `1px solid ${realCrmColors.cardBorder}`,
          boxShadow: 'none',
        },
      },
    },

    // 14. MuiDialog: 16px radius, soft modal shadow
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.24), -40px 40px 80px -8px rgba(145, 158, 171, 0.24)',
          border: `1px solid ${realCrmColors.cardBorder}`,
        },
      },
    },

    // 15. MuiTooltip: #1F2937 background, 8px radius
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: realCrmColors.primaryText,
          color: '#FFFFFF',
          fontSize: '0.75rem',
          borderRadius: 8,
          padding: '6px 10px',
        },
        arrow: {
          color: realCrmColors.primaryText,
        },
      },
    },
  },
});

export default realCrmTheme;
