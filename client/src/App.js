import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

function App() {
  const [symbol, setSymbol] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStock = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `https://stock-sutra.onrender.com/stock/${symbol}`
      );
      setData(response.data);
    } catch (err) {
      setError('Network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" style={{ textAlign: 'center', paddingTop: 40 }}>
      <Typography variant="h4" gutterBottom>
        🚀 <strong>StockSutra</strong>
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Your Smart Market Tracker
      </Typography>

      <Box sx={{ marginBottom: 2 }}>
        {['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'].map((stock) => (
          <Button
            key={stock}
            variant="outlined"
            onClick={() => {
              setSymbol(stock);
              fetchStock();
            }}
            sx={{ m: 0.5 }}
          >
            {stock}
          </Button>
        ))}
      </Box>

      <TextField
        label="Stock Symbol"
        variant="outlined"
        fullWidth
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        sx={{ marginBottom: 2 }}
      />
      <Button
        variant="contained"
        onClick={fetchStock}
        fullWidth
        disabled={loading}
      >
        GET PRICE
      </Button>

      {loading && <CircularProgress sx={{ mt: 2 }} />}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {data && !error && (
        <Paper elevation={3} sx={{ padding: 3, marginTop: 3, textAlign: 'left' }}>
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

          {/* Optional: Add chart if you return `history` array in backend */}
          {data.history && data.history.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1">Price Trend</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.history}>
                  <CartesianGrid stroke="#ccc" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="price" stroke="#1976d2" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
}

export default App;
