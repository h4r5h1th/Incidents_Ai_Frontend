// App.js
import HtmlWithScripts from "./components/HtmlWithScripts";
import React, { useState, useEffect, useRef } from "react";
import {
  AppBar, Toolbar, Typography, IconButton, Container, TextField,
  CircularProgress, Paper, Box, Avatar, Fade, Drawer, List,
  ListItem, ListItemText, ListItemIcon, Divider, CssBaseline
} from "@mui/material";
import {
  SmartToy as SmartToyIcon, Person as PersonIcon, Menu as MenuIcon,
  Save as SaveIcon, Send as SendIcon, Brightness4 as MoonIcon,
  Brightness7 as SunIcon
} from "@mui/icons-material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { v4 as uuidv4 } from "uuid";
import './App.css';

import { ChatContext } from "./context";

function App() {
  const MAX_CHATS = 10;
  const [chatThreads, setChatThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const messagesEndRef = useRef(null);

  // Add this useEffect to your App.js to handle theme changes
useEffect(() => {
  // Set the data-theme attribute on document.documentElement
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
}, [darkMode]);

// Also add this to your existing useEffect that loads stored theme
useEffect(() => {
  const storedThreads = JSON.parse(localStorage.getItem("chatThreads")) || [];
  const storedTheme = localStorage.getItem("theme");
  setChatThreads(storedThreads);
  setActiveThreadId(storedThreads[0]?.id || null);
  if (storedTheme) {
    setDarkMode(storedTheme === "dark");
    // Set initial theme attribute
    document.documentElement.setAttribute('data-theme', storedTheme);
  } else {
    // Default to dark theme
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  setTimeout(() => setLoading(false), 800);
}, []);

  const getActiveMessages = () =>
    chatThreads.find((t) => t.id === activeThreadId)?.messages || [];

  const updateActiveThreadMessages = (newMessages) => {
    setChatThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              messages:
                typeof newMessages === "function"
                  ? newMessages(t.messages)
                  : newMessages,
            }
          : t
      )
    );
  };

  useEffect(() => {
    const storedThreads = JSON.parse(localStorage.getItem("chatThreads")) || [];
    const storedTheme = localStorage.getItem("theme");
    setChatThreads(storedThreads);
    setActiveThreadId(storedThreads[0]?.id || null);
    if (storedTheme) setDarkMode(storedTheme === "dark");
    setTimeout(() => setLoading(false), 800);
  }, []);

  useEffect(() => {
    if (!loading && chatThreads.length === 0) {
      const id = uuidv4();
      const newThread = { id, title: "New Chat", messages: [] };
      setChatThreads([newThread]);
      setActiveThreadId(id);
    }
  }, [loading, chatThreads]);

  useEffect(() => {
    localStorage.setItem("chatThreads", JSON.stringify(chatThreads));
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [chatThreads, darkMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatThreads, activeThreadId]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const assistantMessage = { role: "assistant", content: "" };
    const isNewThread = getActiveMessages().length === 0;
    const userContent = input;
    setInput("");
    setStreaming(true);
    setErrorMessage("");

    updateActiveThreadMessages((msgs) => [...msgs, userMessage, assistantMessage]);

    try {
      const res = await fetch("https://incidents-ai-backend.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage.content }),
      });

      if (!res.ok || !res.body) throw new Error("Network error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let tempContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        tempContent += chunk;

        updateActiveThreadMessages((msgs) => {
          const updated = [...msgs];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: tempContent,
          };
          return updated;
        });
      }
    } catch (err) {
      setErrorMessage("⚠️ Could not reach backend.");
      updateActiveThreadMessages((msgs) => {
        const updated = [...msgs];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "⚠️ Assistant unavailable. Try again later.",
        };
        return updated;
      });
    }

    setStreaming(false);

    if (isNewThread) {
      setChatThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, title: userContent.slice(0, 30) || "New Chat" }
            : t
        )
      );
    }
  };

  const newChat = () => {
    const currentThread = chatThreads.find((t) => t.id === activeThreadId);
    if (
      currentThread &&
      currentThread.messages.length > 0 &&
      currentThread.title === "New Chat"
    ) {
      const newTitle = prompt(
        "Enter a name to save the current chat:",
        currentThread.messages[0]?.content.slice(0, 30) || ""
      );
      if (newTitle) {
        setChatThreads((prev) =>
          prev.map((t) =>
            t.id === currentThread.id ? { ...t, title: newTitle } : t
          )
        );
      }
    }

    const id = uuidv4();
    const newThread = { id, title: "New Chat", messages: [] };
    setChatThreads((prev) => [newThread, ...prev].slice(0, MAX_CHATS));
    setActiveThreadId(id);
    setDrawerOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exportChat = () => {
    const thread = chatThreads.find((t) => t.id === activeThreadId);
    if (!thread) return;
    const blob = new Blob([JSON.stringify(thread.messages, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat_${thread.id}.json`;
    link.click();
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: "#7e57c2" },
      background: {
        default: darkMode ? "#1a1a2e" : "#f5f5f5",
        paper: darkMode ? "#2a2a40" : "#ffffff",
      },
    },
    typography: { fontFamily: "Roboto, sans-serif" },
  });

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading Assistant...</p>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ChatContext.Provider value={{
        chatThreads,
        activeThreadId,
        setActiveThreadId,
        setChatThreads
      }}>
        <AppBar position="fixed" color="primary"
          sx={{
            left: "50%",
            transform: "translateX(-50%)",
            width: "90%",
            backgroundColor: "rgba(95, 95, 95, 0.3)", // translucent
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",       // Safari support
            borderRadius: "16px",
            border: "1px solid rgba(215, 215, 215, 0.2)",
            mt: 1,
            px: 2,
          }}
        >
          <Toolbar>
            <IconButton edge="start" onClick={() => setDrawerOpen(true)} color="inherit">
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
              🤖 Incident AI Assistant
            </Typography>
            {/* <IconButton color="inherit" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <MoonIcon /> : <SunIcon />}
            </IconButton> */}
          </Toolbar>
        </AppBar>

        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 280, height: "100%", backgroundColor: theme.palette.background.default }}>
            <Typography sx={{ p: 2, fontWeight: "bold", color: theme.palette.primary.main }}>
              Chats
            </Typography>
            <Divider />
            <List>
              <ListItem button onClick={() =>{setDrawerOpen(false); newChat()}} sx={{cursor: "pointer"}}>
                <ListItemIcon sx={{ color: theme.palette.primary.main }}><SmartToyIcon /></ListItemIcon>
                <ListItemText primary="New Chat" />
              </ListItem>
              {chatThreads.map((thread) => (
                <ListItem
                  key={thread.id}
                  button
                  selected={thread.id === activeThreadId}
                  onClick={() => {setActiveThreadId(thread.id); setDrawerOpen(false)}}
                  sx={{ pl: 4 , cursor: "pointer"}}
                >
                  <ListItemText primary={thread.title} />
                </ListItem>
              ))}
              <ListItem button onClick={exportChat} sx={{cursor: "pointer"}}>
                <ListItemIcon sx={{ color: theme.palette.primary.main}}><SaveIcon /></ListItemIcon>
                <ListItemText primary="Export Current Chat" />
              </ListItem>
            </List>
          </Box>
        </Drawer>

        <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
          {getActiveMessages().map((msg, index) => (
            <Fade in key={index} timeout={300}>
              <Box
                display="flex"
                mb={2}
                flexDirection={msg.role === "user" ? "row-reverse" : "row"}
                alignItems="flex-start"
              >
                <Avatar sx={{ bgcolor: msg.role === "user" ? "#9575cd" : "#7e57c2" }}>
                  {msg.role === "user" ? <PersonIcon /> : <SmartToyIcon />}
                </Avatar>
                <Paper
                  sx={{
                    p: 2,
                    mx: 2,
                    backgroundColor: msg.role === "user" ? "rgba(118, 12, 176, 0.6)" : "rgba(68, 68, 68, 0.2)" ,
                    color: "#fff",
                    borderRadius: 3,
                    maxWidth: "80%",
                    boxShadow: 3,
                    overflowX: "auto",
                    fontStyle: msg.role === "assistant" && msg.content === "" ? "italic" : "normal",
                    opacity: msg.role === "assistant" && msg.content === "" ? 0.6 : 1,
                    backdropFilter: "blur(10px)",                // frosted glass effect
                    WebkitBackdropFilter: "blur(10px)",          // for Safari
                  }}
                  >
                  {msg.role === "assistant" && msg.content === "" && streaming ? (
                    <Typography>🤖Gathering information and generating response...</Typography>
                  ) : (
                    <HtmlWithScripts html={msg.content} />
                  )}
                </Paper>

              </Box>
            </Fade>
          ))}
          {errorMessage && (
            <Paper sx={{ p: 2, backgroundColor: "#aa2e2e", color: "#fff", borderRadius: 2 }}>
              <Typography variant="body2">{errorMessage}</Typography>
            </Paper>
          )}
          <div ref={messagesEndRef} />
        </Container>

        <Box
          sx={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            backgroundColor: "rgba(95, 95, 95, 0.3)", // translucent background
            backdropFilter: "blur(20px)",                // frosted glass effect
            WebkitBackdropFilter: "blur(20px)",          // for Safari
            borderRadius: "25px",
            border: "1px solid rgba(215, 215, 215, 0.2)", // subtle border
            padding: "12px 24px",
            zIndex: 2, // ensure it stays on top
          }}
        >

          <Container maxWidth="md" sx={{ display: "flex", gap: 0 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              variant="outlined"
              placeholder="Ask Incident Related Querys..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "25px 0px 0px 25px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)", // translucent
                  backdropFilter: "blur(6px)",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.2)", // light border
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#9575cd", // on hover
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#7e57c2", // on focus
                },
                    "& .MuiInputBase-root": {
      overflowX: "auto", // Enables horizontal scrolling inside the text area
    },
    "& textarea": {
      whiteSpace: "nowrap", // Prevents wrapping so horizontal scroll appears
    }
              }}
            />
            <IconButton
              onClick={sendMessage}
              disabled={streaming}
              sx={{
                alignSelf: "end",
                height: "56px",
                borderRadius: 2,
                backgroundColor: theme.palette.primary.main,
                "&:hover": { backgroundColor: "#5e35b1" },
                borderRadius: "0px 25px 25px 0px",
              }}
            >
              {streaming ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                <SendIcon sx={{ color: "white" }} />
              )}
            </IconButton>
          </Container>
        </Box>
      </ChatContext.Provider>
    </ThemeProvider>
  );
}

export default App;
