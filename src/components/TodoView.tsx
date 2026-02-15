"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Paper, Typography, Box, List, ListItem, ListItemIcon, 
  ListItemText, Checkbox, CircularProgress, Divider, IconButton, 
  InputBase, ClickAwayListener 
} from "@mui/material";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function TodoView() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

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

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      setIsAdding(false);
      return;
    }

    // Optimistic update
    const optimisticTask = { id: "opt_" + Date.now(), title: newTaskTitle, status: "needsAction" };
    setTasks([optimisticTask, ...tasks]);
    setNewTaskTitle("");
    setIsAdding(false);

    try {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: optimisticTask.title }),
      });
      if (res.ok) {
        const createdTask = await res.json();
        // Replace optimistic task with real task
        setTasks(prev => prev.map(t => t.id === optimisticTask.id ? createdTask : t));
      } else {
        // Revert on failure
        setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
      }
    } catch (error) {
      console.error("Failed to create task", error);
      setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
    }
  };

  const handleToggleTask = async (task: any) => {
    const newStatus = task.status === "completed" ? "needsAction" : "completed";
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      await fetch("/api/tasks/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          taskId: task.id, 
          taskListId: task.taskListId,
          accountId: task.accountId, // ADDED
          status: newStatus,
          title: task.title, 
          notes: task.notes 
        }),
      });
    } catch (error) {
      console.error("Failed to update task", error);
      // Revert
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const handleDeleteTask = async (task: any) => {
    if (!confirm("Delete this task?")) return;

    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== task.id));

    try {
      await fetch(`/api/tasks/delete?taskId=${task.id}&taskListId=${task.taskListId || ""}&accountId=${task.accountId || ""}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete task", error);
      fetchTasks(); // Revert/Sync
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 1, 
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
            bgcolor: "rgba(255, 149, 0, 0.1)",
            borderRadius: 3,
            color: "#FF9500",
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
        
        <IconButton 
          size="small" 
          onClick={() => setIsAdding(true)}
          sx={{ bgcolor: isAdding ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.03)" }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Task List */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: "auto", 
        px: 0,
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(0,0,0,0.1)", borderRadius: "4px" }
      }}>
        {isAdding && (
          <ClickAwayListener onClickAway={handleCreateTask}>
            <Box sx={{ px: 3, py: 2, borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <InputBase
                inputRef={inputRef}
                fullWidth
                placeholder="New Reminder..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTask();
                  if (e.key === "Escape") {
                    setIsAdding(false);
                    setNewTaskTitle("");
                  }
                }}
                sx={{ fontSize: "1rem", fontWeight: 500 }}
              />
            </Box>
          </ClickAwayListener>
        )}

        {loading && tasks.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={30} color="secondary" />
          </Box>
        ) : tasks.length === 0 && !isAdding ? (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
            <Typography variant="body2">No reminders</Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {tasks.map((task, index) => (
              <Box key={task.id} sx={{ "&:hover .delete-btn": { opacity: 1 } }}>
                <ListItem 
                  sx={{ 
                    px: 3, 
                    py: 2,
                    opacity: task.status === "completed" ? 0.4 : 1,
                    transition: "opacity 0.2s"
                  }}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      className="delete-btn"
                      onClick={() => handleDeleteTask(task)}
                      size="small"
                      sx={{ opacity: 0, transition: "opacity 0.2s", color: "error.main" }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox
                      edge="start"
                      checked={task.status === "completed"}
                      onChange={() => handleToggleTask(task)}
                      icon={<RadioButtonUncheckedIcon sx={{ fontSize: 24, color: "text.secondary" }} />}
                      checkedIcon={<CheckCircleIcon sx={{ fontSize: 24, color: "primary.main" }} />}
                      disableRipple
                      sx={{ p: 0 }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <InputBase 
                        value={task.title}
                        readOnly // Simple read-only for now, full edit could be double-click
                        sx={{ 
                          textDecoration: task.status === "completed" ? "line-through" : "none",
                          color: "text.primary",
                          fontWeight: 500,
                          width: "100%",
                          fontSize: "1rem"
                        }}
                      />
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
