import React, { useState } from 'react';
import axios from 'axios';
import {
  Container, TextField, Button, Typography,
  Paper, Box, CircularProgress, Alert
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import './App.css';

function App() {
  const [symbol, setSymbol] = useState('TCS.NS');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getStockData = async () => {
    if (!symbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`https://stock-sutra.onrender.com/stock/${symbol}`);
      setStockData(response.data);
      setError(null);
    } catch (err) {
      setError('Network error');
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box textAlign="center" mt={5} mb={3}>
        <Typography variant="h3" gutterBottom>
          🚀 StockSutra
        </Typography>
        <Typography variant="subtitle1">
          Your Smart Market Tracker
        </Typography>
      </Box>

      <Box display="flex" justifyContent="center" gap={2} mb={2}>
        {['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'].map((s) => (
          <Button key={s} variant="outlined" onClick={() => setSymbol(s)}>
            {s}
          </Button>
        ))}
      </Box>

      <Box display="flex" gap={2} mb={2}>
        <TextField
          fullWidth
          label="Stock Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
        <Button variant="contained" onClick={getStockData}>
          GET PRICE
        </Button>
      </Box>

      {loading && (
        <Box textAlign="center" mt={3}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {stockData && !error && (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            {stockData.symbol} - ₹{stockData.price}
          </Typography>
          <Typography>
            Open: ₹{stockData.open} | High: ₹{stockData.high} | Low: ₹{stockData.low}
          </Typography>
          <Typography>
            Prev Close: ₹{stockData.previous_close} | Change: ₹{stockData.change} ({stockData.change_percent})
          </Typography>
          <Typography>
            Volume: {stockData.volume} | Time: {stockData.latest_trading_day}
          </Typography>

          {stockData.history && stockData.history.length > 0 && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>Price Chart</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stockData.history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['auto', 'auto']} />
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
