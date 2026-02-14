"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SessionProvider } from "next-auth/react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import React from "react";

const theme = createTheme({
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h5: {
      fontWeight: 700,
      letterSpacing: -0.5,
    },
    h6: {
      fontWeight: 600,
      letterSpacing: -0.5,
    },
  },
  palette: {
    mode: "light",
    primary: {
      main: "#007AFF", // iOS Blue
    },
    secondary: {
      main: "#5856D6", // iOS Purple
    },
    background: {
      default: "#F2F2F7", // iOS System Gray 6
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1C1C1E", // iOS Label Color
      secondary: "#8E8E93", // iOS Secondary Label Color
    },
  },
  shape: {
    borderRadius: 24, // Standardized large corner radius
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F2F2F7",
          overflow: "hidden", // Prevent root scrolling
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 100, // Pill shape for buttons
          boxShadow: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.04)", // Very soft, diffused shadow
          backgroundImage: "none",
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Inner elements have slightly smaller radius
        },
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <CssBaseline />
            {children}
          </LocalizationProvider>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </SessionProvider>
  );
}
