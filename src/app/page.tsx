"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Box, Grid, CircularProgress, Typography, IconButton, Tooltip } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CalendarView from "@/components/CalendarView";
import TodoView from "@/components/TodoView";
import Navbar from "@/components/Navbar";
import { useState } from "react";

export default function Home() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/signin");
    },
  });

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  if (status === "loading") {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", position: "relative" }}>
      {isHeaderVisible ? (
        <Navbar session={session} onHide={() => setIsHeaderVisible(false)} />
      ) : (
        <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1000 }}>
          <Tooltip title="Show Header">
            <IconButton 
              onClick={() => setIsHeaderVisible(true)} 
              size="small" 
              sx={{ 
                bgcolor: "background.paper", 
                boxShadow: 2,
                "&:hover": { bgcolor: "background.paper" } 
              }}
            >
              <KeyboardArrowDownIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <Box component="main" sx={{ flexGrow: 1, p: 2, overflow: "hidden" }}>
        <Grid container spacing={2} sx={{ height: "100%" }}>
          <Grid size={{ xs: 12, md: 6 }} sx={{ height: "100%" }}>
            <CalendarView />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ height: "100%" }}>
            <TodoView />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
