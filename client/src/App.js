import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Stack
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import "./App.css";

function App() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = "https://stock-sutra.onrender.com"; // 🔁 backend base URL

  const fetchStock = async () => {
    if (!symbol) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const response = await axios.get(`${API_BASE}/stock/${symbol}`);
      if (response.data.error) throw new Error(response.data.error);
      setData(response.data);
    } catch (err) {
      setError("Could not fetch stock data. Please check the symbol.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSymbol = (s) => {
    setSymbol(s);
    setTimeout(fetchStock, 100); // delay to update symbol
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Typography variant="h4" align="center" gutterBottom>
        🚀 <b>StockSutra</b>
      </Typography>
      <Typography variant="subtitle1" align="center" gutterBottom>
        Your Smart Market Tracker
      </Typography>

      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" my={2}>
        {["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS"].map((sym) => (
          <Button key={sym} variant="outlined" onClick={() => handleQuickSymbol(sym)}>
            {sym}
          </Button>
        ))}
      </Stack>

      <Box display="flex" gap={2} my={2}>
        <TextField
          label="Stock Symbol"
          variant="outlined"
          fullWidth
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
        <Button variant="contained" onClick={fetchStock}>
          GET PRICE
        </Button>
      </Box>

      {loading && (
        <Box textAlign="center" my={2}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {data && (
        <Paper elevation={4} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Stock Details for {data.symbol}
          </Typography>
          <Typography>Price: ₹{data.price}</Typography>
          <Typography>Open: ₹{data.open}</Typography>
          <Typography>High: ₹{data.high}</Typography>
          <Typography>Low: ₹{data.low}</Typography>
          <Typography>Previous Close: ₹{data.previous_close}</Typography>
          <Typography>Change: {data.change} ({data.change_percent})</Typography>
          <Typography>Volume: {data.volume}</Typography>
          <Typography>Latest Trading Day: {data.latest_trading_day}</Typography>
        </Paper>
      )}
    </Container>
  );
}

export default App;
