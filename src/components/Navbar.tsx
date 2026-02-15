"use client";

import { AppBar, Toolbar, Typography, Avatar, Box, IconButton, Tooltip, ButtonBase, AvatarGroup, Divider, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, List, Button, ListItem } from "@mui/material";
import { signOut, signIn } from "next-auth/react";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import SignalWifi4BarIcon from "@mui/icons-material/SignalWifi4Bar";
import SettingsIcon from "@mui/icons-material/Settings";
import CloudIcon from "@mui/icons-material/Cloud";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function Navbar({ session, onHide }: { session: any, onHide: () => void }) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  const handleUnlink = async (accountId: string) => {
    if (confirm("Are you sure you want to unlink this account?")) {
      try {
        const res = await fetch(`/api/auth/unlink?accountId=${accountId}`, { method: "DELETE" });
        if (res.ok) window.location.reload();
      } catch (error) {
        console.error("Failed to unlink account", error);
      }
    }
  };

  const accounts = session?.accounts || [];

  // Common Dialog Props for consistency
  const dialogProps = {
    fullWidth: true,
    maxWidth: "xs" as const,
    slotProps: {
      backdrop: {
        sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.4)' }
      }
    },
    PaperProps: {
      sx: { borderRadius: 1, p: 1, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }
    }
  };

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
          onClick={() => setIsWeatherOpen(true)}
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
            <IconButton size="small" sx={{ color: "text.secondary" }}><SignalWifi4BarIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton size="small" sx={{ color: "text.secondary" }}><SettingsIcon /></IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: "center", mx: 1 }} />
          
          <ButtonBase
            onClick={() => setIsAccountOpen(true)}
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
            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 12 } }}>
              {accounts.length > 0 ? accounts.map((acc: any) => (
                <Avatar key={acc.id} alt={acc.name} src={acc.image} />
              )) : (
                <Avatar alt={session?.user?.name} src={session?.user?.image} />
              )}
            </AvatarGroup>
          </ButtonBase>

          <IconButton onClick={onHide} size="small" sx={{ color: "text.secondary", ml: 1 }}><KeyboardArrowUpIcon /></IconButton>
        </Box>

        {/* Accounts Dialog */}
        <Dialog open={isAccountOpen} onClose={() => setIsAccountOpen(false)} {...dialogProps}>
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="800">Connected Accounts</Typography>
            <IconButton onClick={() => setIsAccountOpen(false)} size="small"><CloseIcon fontSize="small" /></IconButton>
          </Box>
          <DialogContent sx={{ pt: 0 }}>
            <List>
              {accounts.map((acc: any) => (
                <ListItem key={acc.id} sx={{ 
                  mb: 1, 
                  borderRadius: 3, 
                  bgcolor: "rgba(0,0,0,0.02)",
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  p: 2 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={acc.image} sx={{ width: 40, height: 40 }} />
                    <Box>
                      <Typography variant="body1" fontWeight="700">{acc.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{acc.email}</Typography>
                    </Box>
                  </Box>
                  {accounts.length > 1 && (
                    <IconButton size="small" color="error" onClick={() => handleUnlink(acc.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button fullWidth variant="outlined" startIcon={<AddIcon />} onClick={() => signIn("google")} sx={{ borderRadius: 3 }}>
                Link another account
              </Button>
              <Button fullWidth color="error" startIcon={<LogoutIcon />} onClick={() => signOut()} sx={{ borderRadius: 3 }}>
                Sign Out
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Weather Dialog */}
        <Dialog open={isWeatherOpen} onClose={() => setIsWeatherOpen(false)} {...dialogProps}>
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="800">Weekly Forecast</Typography>
            <IconButton onClick={() => setIsWeatherOpen(false)} size="small"><CloseIcon fontSize="small" /></IconButton>
          </Box>
          <DialogContent>
            <List disablePadding>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <Box key={day} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, p: 1.5, borderRadius: 3, bgcolor: i === 0 ? "rgba(0,122,255,0.05)" : "transparent" }}>
                  <Typography variant="body1" fontWeight="700" sx={{ width: 60 }}>{day}</Typography>
                  {i % 3 === 0 ? <CloudIcon sx={{ color: "text.secondary" }} /> : 
                   i % 2 === 0 ? <WaterDropIcon sx={{ color: "#007AFF" }} /> : 
                   <WbSunnyIcon sx={{ color: "#FF9500" }} />}
                  <Box sx={{ display: "flex", gap: 2, width: 100, justifyContent: "flex-end" }}>
                    <Typography variant="body1" fontWeight="700">7{i}°</Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight="500">6{i}°</Typography>
                  </Box>
                </Box>
              ))}
            </List>
          </DialogContent>
        </Dialog>

      </Toolbar>
    </AppBar>
  );
}
