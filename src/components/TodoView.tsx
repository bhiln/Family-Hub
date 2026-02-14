"use client";

import { useEffect, useState } from "react";
import { 
  Paper, Typography, Box, List, ListItem, ListItemIcon, 
  ListItemText, Checkbox, CircularProgress, Divider, IconButton 
} from "@mui/material";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";

export default function TodoView() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch("/api/tasks/list");
        const data = await res.json();
        if (Array.isArray(data)) {
          setTasks(data);
        }
      } catch (error) {
        console.error("Failed to fetch tasks", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 1, // Uses theme.shape.borderRadius (24px)
        bgcolor: "background.paper",
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.06)",
        position: "relative"
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
        flexShrink: 0
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ 
            p: 1.2, 
            bgcolor: "rgba(255, 149, 0, 0.1)", // Apple Orange, transparent
            borderRadius: 3,
            color: "#FF9500", // Apple Orange
            display: "flex"
          }}>
            <FormatListNumberedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="700" sx={{ lineHeight: 1.2 }}>
              Reminders
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight="500">
              {tasks.length} tasks
            </Typography>
          </Box>
        </Box>
        
        <IconButton size="small" sx={{ bgcolor: "rgba(0,0,0,0.03)" }}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Task List - Scrollable Area */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: "auto", 
        px: 0,
        /* Hide scrollbar */
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(0,0,0,0.1)", borderRadius: "4px" }
      }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={30} color="secondary" />
          </Box>
        ) : tasks.length === 0 ? (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
            <Typography variant="body2">No reminders</Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {tasks.map((task, index) => (
              <Box key={task.id}>
                <ListItem 
                  sx={{ 
                    px: 3, 
                    py: 2,
                    opacity: task.status === "completed" ? 0.4 : 1,
                    transition: "opacity 0.2s"
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox
                      edge="start"
                      checked={task.status === "completed"}
                      icon={<RadioButtonUncheckedIcon sx={{ fontSize: 24, color: "text.secondary" }} />}
                      checkedIcon={<CheckCircleIcon sx={{ fontSize: 24, color: "primary.main" }} />}
                      disableRipple
                      sx={{ p: 0 }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body1" 
                        fontWeight="500"
                        sx={{ 
                          textDecoration: task.status === "completed" ? "line-through" : "none",
                          color: "text.primary"
                        }}
                      >
                        {task.title}
                      </Typography>
                    }
                    secondary={task.notes ? (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        {task.notes}
                      </Typography>
                    ) : null}
                    sx={{ m: 0 }}
                  />
                </ListItem>
                {index < tasks.length - 1 && (
                  <Divider component="li" sx={{ ml: 8, borderColor: "rgba(0,0,0,0.04)" }} />
                )}
              </Box>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}
