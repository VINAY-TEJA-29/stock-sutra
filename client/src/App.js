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
    setData(null);
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
    <Container maxWidth="sm" style={{ textAlign: "center", paddingTop: 30 }}>
      <Typography variant="h3" gutterBottom>
        🚀 <b>StockSutra</b>
      </Typography>
      <Typography variant="h6" gutterBottom>
        Your Smart Market Tracker
      </Typography>

      <Box mb={2}>
        {["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS"].map((s) => (
          <Button
            key={s}
            variant="outlined"
            onClick={() => setSymbol(s)}
            style={{ margin: "5px" }}
          >
            {s}
          </Button>
        ))}
      </Box>

      <TextField
        label="Stock Symbol"
        variant="outlined"
        fullWidth
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={fetchStock}
        style={{ marginBottom: 16 }}
      >
        GET PRICE
      </Button>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {data && (
        <Paper style={{ padding: 16, marginTop: 16 }}>
          <Typography variant="h6">Stock Details for {data.symbol}</Typography>
          <Typography>Price: ₹{data.price}</Typography>
          <Typography>Open: ₹{data.open}</Typography>
          <Typography>High: ₹{data.high}</Typography>
          <Typography>Low: ₹{data.low}</Typography>
          <Typography>Previous Close: ₹{data.previous_close}</Typography>
          <Typography>
            Change: {data.change} ({data.change_percent})
          </Typography>
          <Typography>Volume: {data.volume}</Typography>
          <Typography>Latest Trading Day: {data.latest_trading_day}</Typography>
        </Paper>
      )}
    </Container>
  );
}

export default App;
