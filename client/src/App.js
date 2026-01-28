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

/* ================== CHART REGISTER ================== */
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
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [marketStatus, setMarketStatus] = useState("Closed");

  /* ================== MARKET STATUS (NSE) ================== */
  const getMarketStatus = () => {
    const now = new Date();
    const ist = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const day = ist.getDay(); // 0 Sun, 6 Sat
    const minutes = ist.getHours() * 60 + ist.getMinutes();

    const open = 9 * 60 + 15;
    const close = 15 * 60 + 30;

    if (day === 0 || day === 6) return "Closed";
    return minutes >= open && minutes <= close ? "Open" : "Closed";
  };

  useEffect(() => {
    setMarketStatus(getMarketStatus());
    const timer = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  /* ================== FETCH STOCK SUMMARY ================== */
  const fetchStock = async () => {
    if (!symbol.trim()) {
      setError("Please enter a stock symbol");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);
    setChartData(null);

    try {
      const res = await axios.get(
        `https://stock-sutra.onrender.com/stock/${symbol.trim()}`
      );

      setData(res.data);
      fetchChart(symbol.trim());
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not fetch stock data"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================== FETCH INTRADAY CHART ================== */
  const fetchChart = async (sym) => {
    try {
      const res = await axios.get(
        `https://stock-sutra.onrender.com/stock/${sym}/chart`
      );

      const labels = res.data.data.map((p) => p.time);
      const prices = res.data.data.map((p) => p.price);

      setChartData({
        labels,
        datasets: [
          {
            label: `${sym} Intraday`,
            data: prices,
            borderColor: "#1976d2",
            backgroundColor: "rgba(25,118,210,0.15)",
            tension: 0.35,
            pointRadius: 0,
          },
        ],
      });
    } catch (e) {
      console.error("Chart fetch failed");
    }
  };

  /* ================== UI ================== */
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
        style={{
          color: marketStatus === "Open" ? "green" : "red",
          fontWeight: "bold",
          marginBottom: 15,
        }}
      >
        Market Status: {marketStatus}
      </Typography>

      {/* QUICK BUTTONS */}
      <Box mb={2}>
        {["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS"].map((s) => (
          <Button
            key={s}
            variant="outlined"
            onClick={() => setSymbol(s)}
            style={{ margin: 5 }}
          >
            {s}
          </Button>
        ))}
      </Box>

      {/* INPUT */}
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
          <Typography>Volume: {data.volume ?? "-"}</Typography>
          <Typography>
            Latest Trading Day: {data.latest_trading_day}
          </Typography>
        </Paper>
      )}

      {/* INTRADAY CHART */}
      {chartData && (
        <Paper style={{ padding: 16, marginTop: 20 }}>
          <Typography variant="h6">Intraday Price Chart</Typography>
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: { legend: { display: true } },
              scales: {
                x: { ticks: { maxTicksLimit: 8 } },
              },
            }}
          />
        </Paper>
      )}
    </Container>
  );
}

export default App;
