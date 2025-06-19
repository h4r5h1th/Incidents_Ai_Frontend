import React from "react";
import { Typography, Box, Paper } from "@mui/material";

function Home() {
  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Paper sx={{ p: 4, borderRadius: 4, backgroundColor: "#1e1e1e", color: "#fff" }}>
        <Typography variant="h4" gutterBottom>
          🎬 Welcome to Incident AI Assistant
        </Typography>
        <Typography variant="body1">
          This assistant is designed to help you handle incidents, provide quick answers,
          and keep a searchable history. Use the sidebar to start a chat or revisit past queries.
        </Typography>
      </Paper>
    </Box>
  );
}

export default Home;
