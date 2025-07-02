import React, { useState } from "react";
import axios from "axios";
import {
  Container, TextField, Button, Typography, Paper, Box,
  CircularProgress, Alert
} from "@mui/material";
import "./App.css";

function App() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStock = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`https://stock-sutra.onrender.com/stock/${symbol}`);
      setData(response.data);
    } catch (err) {
      setError("Could not fetch stock data. Please check the symbol.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" align="center" gutterBottom>
        📈 StockSutra — Your Smart Market Tracker
      </Typography>
      <Box display="flex" justifyContent="center" my={2}>
        <TextField
          label="Stock Symbol (e.g., TCS.NS)"
          variant="outlined"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={fetchStock} sx={{ ml: 2 }}>
          Get Data
        </Button>
      </Box>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {data && (
        <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6">Stock Details for {data.symbol}</Typography>
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
