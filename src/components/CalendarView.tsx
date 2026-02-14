"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Paper, Typography, Box, List, ListItem, ListItemText, 
  IconButton, Grid, useTheme, Divider, Popover, Link
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionIcon from "@mui/icons-material/Description";
import { 
  format, parseISO, isSameDay, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, addMonths, 
  subMonths, isToday 
} from "date-fns";

export default function CalendarView() {
  const theme = useTheme();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Popover state
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/calendar/events");
        const data = await res.json();
        if (Array.isArray(data)) {
          const seen = new Set();
          const uniqueEvents = data.filter(event => {
            const start = event.start?.dateTime || event.start?.date;
            const key = `${event.id}-${start}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setEvents(uniqueEvents);
        }
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const start = event.start?.dateTime || event.start?.date;
      return isSameDay(parseISO(start), selectedDate);
    });
  }, [events, selectedDate]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const start = event.start?.dateTime || event.start?.date;
      return isSameDay(parseISO(start), day);
    });
  };

  const getEventColor = (event: any) => {
    // Google Calendar Color ID mapping
    const googleColors: { [key: string]: string } = {
      "1": "#7986cb", // Lavender
      "2": "#33b679", // Sage
      "3": "#8e24aa", // Grape
      "4": "#e67c73", // Flamingo
      "5": "#f6c026", // Banana
      "6": "#f4511e", // Tangerine
      "7": "#039be5", // Peacock
      "8": "#616161", // Graphite
      "9": "#3f51b5", // Blueberry
      "10": "#0b8043", // Basil
      "11": "#d50000", // Tomato
    };

    if (event.colorId && googleColors[event.colorId]) {
      return googleColors[event.colorId];
    }
    
    // Fallback to the calendar's main color if provided
    if (event.calendarColor) {
      return event.calendarColor;
    }

    // Fallback to random color based on ID/summary if no colorId from Google
    const colors = ["#FF3B30", "#FF9500", "#FFCC00", "#4CD964", "#5AC8FA", "#007AFF", "#5856D6", "#FF2D55"];
    let hash = 0;
    const str = event.id || event.summary || "";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleEventClick = (event: any, currentTarget: HTMLElement) => {
    setSelectedEvent(event);
    setAnchorEl(currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  const openPopover = Boolean(anchorEl);

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%", // Fill parent container
        display: "flex",
        flexDirection: "column",
        borderRadius: 1, // Uses theme.shape.borderRadius (24px)
        bgcolor: "background.paper",
        overflow: "hidden", // Prevent overflow on the card itself
        border: "1px solid rgba(0,0,0,0.06)",
        position: "relative" // Context for absolute positioned elements if needed
      }}
    >
      {/* Top Half: Calendar (Exactly 50%) */}
      <Box sx={{ height: "50%", display: "flex", flexDirection: "column" }}>
        {/* Header - Fixed Height */}
        <Box sx={{ 
          px: 3,
          py: 2, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexShrink: 0 // Prevent header from shrinking
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ 
              p: 1, 
              bgcolor: "rgba(0, 122, 255, 0.1)", // Apple Blue, transparent
              borderRadius: 3, // Squircle-ish
              color: "primary.main",
              display: "flex"
            }}>
              <CalendarTodayIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="700" sx={{ lineHeight: 1.2 }}>
                Family Calendar
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="500">
                {format(currentMonth, "MMMM yyyy")}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "rgba(0,0,0,0.03)", borderRadius: 100, p: 0.5 }}>
            <IconButton size="small" onClick={handlePrevMonth}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" fontWeight="600" sx={{ minWidth: 80, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {format(currentMonth, "MMMM")}
            </Typography>
            <IconButton size="small" onClick={handleNextMonth}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Calendar Grid - Takes remaining space in top half, but content is fixed size */}
        <Box sx={{ px: 2, pb: 1, flexGrow: 1, overflow: "hidden" }}>
          {/* Day Names Header */}
          <Grid container spacing={0} sx={{ mb: 1 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <Grid key={i} size={12/7} sx={{ textAlign: "center" }}>
                <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ opacity: 0.7 }}>
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Days Grid */}
          <Grid container spacing={0} rowSpacing={0.5}>
            {calendarDays.map((day, idx) => {
              const isSelected = isSameDay(day, selectedDate);
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isTodayDate = isToday(day);
              
              return (
                <Grid key={idx} size={12/7} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box
                    onClick={() => setSelectedDate(day)}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%", // Fully circular selection
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      position: "relative",
                      transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                      bgcolor: isSelected ? "primary.main" : "transparent",
                      color: isSelected ? "white" : isCurrentMonth ? "text.primary" : "text.disabled",
                      "&:hover": {
                        bgcolor: isSelected ? "primary.main" : "rgba(0,0,0,0.04)"
                      }
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      fontWeight={isSelected || isTodayDate ? "700" : "500"}
                      sx={{ 
                        opacity: isCurrentMonth || isSelected ? 1 : 0.5,
                        color: isTodayDate && !isSelected ? "primary.main" : "inherit",
                        fontSize: "1rem"
                      }}
                    >
                      {format(day, "d")}
                    </Typography>
                    
                    {/* Event Dots */}
                    <Box sx={{ 
                      display: "flex", 
                      gap: 0.3, 
                      position: "absolute", 
                      bottom: 4 
                    }}>
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <Box key={i} sx={{ 
                          width: 4, 
                          height: 4, 
                          borderRadius: "50%", 
                          bgcolor: isSelected ? "white" : getEventColor(event),
                          opacity: isSelected ? 0.9 : 1
                        }} />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Box>

      <Divider sx={{ mx: 3, mb: 0 }} />

      {/* Schedule Section - Flexible Height (Takes remaining space) */}
      <Box sx={{ 
        flexGrow: 1, // Fill remaining space (effectively bottom 50%)
        display: "flex", 
        flexDirection: "column",
        overflow: "hidden", // Prepare for internal scroll
        bgcolor: "#FAFAFA" // Slightly different bg for schedule area
      }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ letterSpacing: 0.5, textTransform: "uppercase" }}>
            Schedule · {format(selectedDate, "EEE, MMM d")}
          </Typography>
        </Box>
        
        <Box sx={{ 
          flexGrow: 1, 
          overflowY: "auto", // Internal scrolling only
          px: 2,
          pb: 2,
          /* Hide scrollbar for cleaner look but keep functionality */
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(0,0,0,0.1)", borderRadius: "4px" }
        }}>
          {filteredEvents.length === 0 ? (
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
              <Typography variant="body2">No events</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredEvents.map((event, idx) => {
                const start = event.start?.dateTime || event.start?.date;
                const timeLabel = event.start?.dateTime 
                  ? format(parseISO(event.start.dateTime), "h:mm a")
                  : "All Day";
                
                const accentColor = getEventColor(event);

                return (
                  <ListItem 
                    button
                    onClick={(e) => handleEventClick(event, e.currentTarget)}
                    key={event.id + idx}
                    sx={{ 
                      mb: 1.5, 
                      bgcolor: "white", 
                      borderRadius: 1, // Standardized squircle (24px)
                      boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                      border: "1px solid rgba(0,0,0,0.02)",
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      minHeight: 72,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#f9f9f9" }
                    }}
                  >
                    {/* Floating colored pill */}
                    <Box sx={{ 
                      width: 6, 
                      height: 40, 
                      borderRadius: 4, 
                      bgcolor: accentColor,
                      mr: 2.5,
                      flexShrink: 0
                    }} />
                    
                    <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <Typography variant="body1" fontWeight="700" sx={{ mb: 0.5, fontSize: "1rem", color: "#1C1C1E" }}>
                        {event.summary}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: "text.secondary" }}>
                        <AccessTimeIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                        <Typography variant="body2" fontWeight="500" sx={{ fontSize: "0.85rem" }}>
                          {timeLabel}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </Box>

      {/* Event Details Popover */}
      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: { width: 320, borderRadius: 1, p: 3, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }
        }}
      >
        {selectedEvent && (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: getEventColor(selectedEvent) }} />
              <Typography variant="h6" fontWeight="700" sx={{ lineHeight: 1.2 }}>
                {selectedEvent.summary}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <AccessTimeIcon color="action" fontSize="small" sx={{ mt: 0.2 }} />
                <Box>
                  <Typography variant="body2" fontWeight="600">
                    {selectedEvent.start?.dateTime 
                      ? `${format(parseISO(selectedEvent.start.dateTime), "EEEE, MMMM d")}` 
                      : "All Day"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedEvent.start?.dateTime 
                      ? `${format(parseISO(selectedEvent.start.dateTime), "h:mm a")} - ${format(parseISO(selectedEvent.end.dateTime), "h:mm a")}` 
                      : "All Day"}
                  </Typography>
                </Box>
              </Box>

              {selectedEvent.location && (
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <LocationOnIcon color="action" fontSize="small" sx={{ mt: 0.2 }} />
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {selectedEvent.location}
                  </Typography>
                </Box>
              )}

              {selectedEvent.description && (
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <DescriptionIcon color="action" fontSize="small" sx={{ mt: 0.2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                    {selectedEvent.description}
                  </Typography>
                </Box>
              )}
              
              {selectedEvent.htmlLink && (
                <Box sx={{ mt: 1, textAlign: "right" }}>
                  <Link href={selectedEvent.htmlLink} target="_blank" rel="noopener" underline="hover" variant="caption" fontWeight="600">
                    Open in Google Calendar
                  </Link>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Popover>
    </Paper>
  );
}
