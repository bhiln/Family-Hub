"use client";

import { signIn } from "next-auth/react";
import { Button, Container, Typography, Box, Paper } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

export default function SignIn() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            textAlign: "center",
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom fontWeight="bold">
            Family Organizer
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Welcome to your family's home hub. Sign in with Google to get started.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={() => signIn("google", { callbackUrl: "/" })}
            sx={{
              py: 1.5,
              backgroundColor: "#4285F4",
              "&:hover": {
                backgroundColor: "#357ae8",
              },
            }}
          >
            Sign in with Google
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}
