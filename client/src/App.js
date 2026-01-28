import React, { useState, useEffect } from "react";
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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

function App() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [marketStatus, setMarketStatus] = useState("Closed");

  // 🟢 MARKET OPEN / CLOSE LOGIC (IST – NSE)
  const getMarketStatus = () => {
    const now = new Date();
    const istTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const day = istTime.getDay();
    const minutes = istTime.getHours() * 60 + istTime.getMinutes();

    const marketOpen = 9 * 60 + 15;
    const marketClose = 15 * 60 + 30;

    if (day === 0 || day === 6) return "Closed";

    return minutes >= marketOpen && minutes <= marketClose
      ? "Open"
      : "Closed";
  };

  useEffect(() => {
    setMarketStatus(getMarketStatus());
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch stock data
  const fetchStock = async () => {
    if (!symbol.trim()) {
      setError("Please enter a stock symbol");
      return;
    }

    if (loading) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await axios.get(
        `https://stock-sutra.onrender.com/stock/${symbol.trim()}`
      );
      setData(response.data);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Could not fetch stock data");
      }
    } finally {
      setLoading(false);
    }
  };

  // 📊 PRICE CHART DATA
  const chartData =
    data && {
      labels: ["Open", "Low", "High", "Close"],
      datasets: [
        {
          label: data.symbol,
          data: [data.open, data.low, data.high, data.price],
          borderColor: "#1976d2",
          backgroundColor: "rgba(25,118,210,0.2)",
          tension: 0.4,
        },
      ],
    };

  return (
    <Container maxWidth="sm" style={{ textAlign: "center", paddingTop: 30 }}>
      <Typography variant="h3" gutterBottom>
        🚀 <b>StockSutra</b>
      </Typography>

      <Typography variant="h6" gutterBottom>
        Your Smart Market Tracker
      </Typography>

      {/* MARKET STATUS */}
      <Typography
        variant="subtitle1"
        style={{
          color: marketStatus === "Open" ? "green" : "red",
          fontWeight: "bold",
          marginBottom: 15,
        }}
      >
        Market Status: {marketStatus}
      </Typography>

      {/* QUICK SYMBOLS */}
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
        disabled={loading}
        style={{ marginBottom: 16 }}
      >
        GET PRICE
      </Button>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {/* STOCK DETAILS */}
      {data && (
        <>
          <Paper style={{ padding: 16, marginTop: 16 }}>
            <Typography variant="h6">
              Stock Details for {data.symbol}
            </Typography>
            <Typography>Price: ₹{data.price}</Typography>
            <Typography>Open: ₹{data.open}</Typography>
            <Typography>High: ₹{data.high}</Typography>
            <Typography>Low: ₹{data.low}</Typography>
            <Typography>Previous Close: ₹{data.previous_close}</Typography>
            <Typography>
              Change: {data.change} ({data.change_percent})
            </Typography>
            <Typography>Volume: {data.volume}</Typography>
            <Typography>
              Latest Trading Day: {data.latest_trading_day}
            </Typography>
          </Paper>

          {/* 📊 PRICE CHART */}
          <Paper style={{ padding: 16, marginTop: 20 }}>
            <Typography variant="h6">Price Chart</Typography>
            <Line data={chartData} />
          </Paper>
        </>
      )}
    </Container>
  );
}

export default App;
