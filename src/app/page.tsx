"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Box, Grid, CircularProgress, Typography } from "@mui/material";
import CalendarView from "@/components/CalendarView";
import TodoView from "@/components/TodoView";
import Navbar from "@/components/Navbar";

export default function Home() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/signin");
    },
  });

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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <Navbar session={session} />
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
