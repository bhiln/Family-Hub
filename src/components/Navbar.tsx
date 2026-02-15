"use client";

import { AppBar, Toolbar, Typography, Avatar, Box, IconButton, Tooltip, ButtonBase, AvatarGroup, Menu, MenuItem, Divider, ListItemIcon, ListItemText, Popover, List, useTheme } from "@mui/material";
import { signOut, signIn } from "next-auth/react";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import SignalWifi4BarIcon from "@mui/icons-material/SignalWifi4Bar";
import SettingsIcon from "@mui/icons-material/Settings";
import CloudIcon from "@mui/icons-material/Cloud";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function Navbar({ session, onHide }: { session: any, onHide: () => void }) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [weatherAnchorEl, setWeatherAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const openAccountMenu = Boolean(anchorEl);
  const openWeatherMenu = Boolean(weatherAnchorEl);

  const handleAccountClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleWeatherClick = (event: React.MouseEvent<HTMLElement>) => {
    setWeatherAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setWeatherAnchorEl(null);
  };

  const handleUnlink = async (accountId: string) => {
    if (confirm("Are you sure you want to unlink this account?")) {
      try {
        const res = await fetch(`/api/auth/unlink?accountId=${accountId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          window.location.reload();
        }
      } catch (error) {
        console.error("Failed to unlink account", error);
      }
    }
  };

  const accounts = session?.accounts || [];

  return (
    <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: "1px solid rgba(0,0,0,0.06)", height: 80, justifyContent: "center" }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        
        {/* Left: Date & Time */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography variant="h4" fontWeight="800" sx={{ lineHeight: 1, letterSpacing: -1 }}>
              {format(currentTime, "h:mm a")}
            </Typography>
            <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
              {format(currentTime, "EEEE, MMM d")}
            </Typography>
          </Box>
        </Box>

        {/* Center: Weather Widget */}
        <ButtonBase
          onClick={handleWeatherClick}
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1.5, 
            px: 2, 
            py: 1, 
            borderRadius: 4, 
            transition: "all 0.2s",
            "&:hover": { bgcolor: "rgba(0,0,0,0.03)" }
          }}
        >
          <WbSunnyIcon sx={{ color: "#FF9500", fontSize: 32 }} />
          <Box sx={{ textAlign: "left" }}>
            <Typography variant="h6" fontWeight="700" sx={{ lineHeight: 1 }}>72°</Typography>
            <Typography variant="caption" color="text.secondary" fontWeight="600">Sunny</Typography>
          </Box>
        </ButtonBase>

        {/* Right: System Status & Tools */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          
          <Tooltip title="Signal Strength: Good">
            <IconButton size="small" sx={{ color: "text.secondary" }}>
              <SignalWifi4BarIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton size="small" sx={{ color: "text.secondary" }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: "center", mx: 1 }} />

          {/* Account Switcher */}
          <ButtonBase
            onClick={handleAccountClick}
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              padding: "4px 8px",
              borderRadius: "16px", 
              bgcolor: "rgba(0,0,0,0.03)", 
              transition: "all 0.2s",
              "&:hover": { bgcolor: "rgba(0,0,0,0.06)" }
            }}
          >
            <AvatarGroup max={3} sx={{ mr: accounts.length > 1 ? 1 : 0, '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 12 } }}>
              {accounts.length > 0 ? (
                accounts.map((acc: any) => (
                  <Avatar key={acc.id} alt={acc.name} src={acc.image} />
                ))
              ) : (
                <Avatar alt={session?.user?.name} src={session?.user?.image} />
              )}
            </AvatarGroup>
          </ButtonBase>

          <Tooltip title="Hide Header">
            <IconButton onClick={onHide} size="small" sx={{ color: "text.secondary", ml: 1 }}>
              <KeyboardArrowUpIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Account Menu */}
        <Menu
          anchorEl={anchorEl}
          open={openAccountMenu}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 0,
            sx: {
              filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.1))',
              mt: 1.5,
              borderRadius: 1, 
              minWidth: 240,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight="bold">Connected Accounts</Typography>
          </Box>
          <Divider />
          {accounts.map((acc: any) => (
            <MenuItem key={acc.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar src={acc.image} sx={{ width: 32, height: 32 }} />
                <Box>
                  <Typography variant="body2" fontWeight="600">{acc.name}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">{acc.email}</Typography>
                </Box>
              </Box>
              {accounts.length > 1 && (
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnlink(acc.id);
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
            </MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={() => { handleClose(); signIn("google"); }} sx={{ py: 1.5 }}>
            <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
            <Typography variant="body2" fontWeight="500">Link another account</Typography>
          </MenuItem>
          <MenuItem onClick={() => signOut()} sx={{ py: 1.5 }}>
            <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
            <Typography variant="body2" fontWeight="500" color="error">Sign Out</Typography>
          </MenuItem>
        </Menu>

        {/* Weather Menu */}
        <Popover
          open={openWeatherMenu}
          anchorEl={weatherAnchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          PaperProps={{
            sx: { borderRadius: 1, p: 2, width: 300, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }
          }}
        >
          <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 2 }}>Weekly Forecast</Typography>
          <List disablePadding>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <Box key={day} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="body2" fontWeight="600" sx={{ width: 40 }}>{day}</Typography>
                {i % 3 === 0 ? <CloudIcon sx={{ color: "text.secondary", fontSize: 20 }} /> : 
                 i % 2 === 0 ? <WaterDropIcon sx={{ color: "#007AFF", fontSize: 20 }} /> : 
                 <WbSunnyIcon sx={{ color: "#FF9500", fontSize: 20 }} />}
                <Box sx={{ display: "flex", gap: 2, width: 80, justifyContent: "flex-end" }}>
                  <Typography variant="body2" fontWeight="600">7{i}°</Typography>
                  <Typography variant="body2" color="text.secondary">6{i}°</Typography>
                </Box>
              </Box>
            ))}
          </List>
        </Popover>

      </Toolbar>
    </AppBar>
  );
}
