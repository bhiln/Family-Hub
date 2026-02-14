"use client";

import { AppBar, Toolbar, Typography, Avatar, Box, IconButton, Tooltip, Button, AvatarGroup, Menu, MenuItem, Divider, ListItemIcon, ListItemText } from "@mui/material";
import { signOut, signIn } from "next-auth/react";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useState } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useRouter } from "next/navigation";

export default function Navbar({ session, onHide }: { session: any, onHide: () => void }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const router = useRouter();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleUnlink = async (accountId: string) => {
    if (confirm("Are you sure you want to unlink this account? It will no longer show up in your calendar or tasks.")) {
      try {
        const res = await fetch(`/api/auth/unlink?accountId=${accountId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          // Force a hard reload to ensure session is cleared/updated
          window.location.reload();
        } else {
          const errorData = await res.json();
          alert(`Failed to unlink: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error("Failed to unlink account", error);
        alert("An error occurred while unlinking the account.");
      }
    }
  };

  const accounts = session?.accounts || [];

  return (
    <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: "1px solid #e0e0e0" }}>
      <Toolbar>
        <HomeIcon sx={{ mr: 2, color: "primary.main" }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: "bold" }}>
          Family Organizer
        </Typography>
        
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Box 
            onClick={handleClick}
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "16px", // Updated to squircle-ish
              bgcolor: "rgba(0,0,0,0.03)", // Subtle background
              transition: "all 0.2s",
              "&:hover": { bgcolor: "rgba(0,0,0,0.06)" }
            }}
          >
            <AvatarGroup max={4} sx={{ mr: accounts.length > 1 ? 1 : 0 }}>
              {accounts.length > 0 ? (
                accounts.map((acc: any) => (
                  <Avatar 
                    key={acc.id} 
                    alt={acc.name} 
                    src={acc.image} 
                    sx={{ width: 32, height: 32, border: "2px solid #fff !important" }} 
                  />
                ))
              ) : (
                <Avatar alt={session?.user?.name} src={session?.user?.image} sx={{ width: 32, height: 32 }} />
              )}
            </AvatarGroup>
            {accounts.length > 1 && (
              <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ ml: 0.5 }}>
                {accounts.length}
              </Typography>
            )}
          </Box>

          <Tooltip title="Sign Out">
            <IconButton onClick={() => signOut()} size="small" sx={{ color: "text.secondary" }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Hide Header">
            <IconButton onClick={onHide} size="small" sx={{ color: "text.secondary" }}>
              <KeyboardArrowUpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 0,
            sx: {
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              borderRadius: 1, // Squircle (24px)
              minWidth: 200,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">Connected Accounts</Typography>
          </Box>
          <Divider />
          {accounts.map((acc: any) => (
            <MenuItem key={acc.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ListItemIcon>
                  <Avatar src={acc.image} sx={{ width: 24, height: 24 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={acc.name} 
                  secondary={acc.email} 
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {accounts.length > 1 && (
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnlink(acc.id);
                    }}
                    sx={{ ml: 1, opacity: 0.7, '&:hover': { opacity: 1 } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                )}
                <CheckCircleIcon color="success" sx={{ fontSize: 16, ml: 1 }} />
              </Box>
            </MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={() => { handleClose(); signIn("google"); }}>
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <Typography variant="body2">Add another account</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
