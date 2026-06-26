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
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Autocomplete
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

// Environment Aware API URL
const BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://stock-sutra.onrender.com");

// Popular stock options for Autocomplete
const POPULAR_STOCKS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries Ltd." },
  { symbol: "TCS.NS", name: "Tata Consultancy Services Ltd." },
  { symbol: "INFY.NS", name: "Infosys Ltd." },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd." },
  { symbol: "IRFC.NS", name: "Indian Railway Finance Corp." },
  { symbol: "ZOMATO.NS", name: "Zomato Ltd." },
  { symbol: "SBI.NS", name: "State Bank of India" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel Ltd." },
  { symbol: "ITC.NS", name: "ITC Ltd." },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel Ltd." },
  { symbol: "WIPRO.NS", name: "Wipro Ltd." },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd." },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever Ltd." },
  { symbol: "MUTHOOTFIN.NS", name: "Muthoot Finance Ltd." },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd." },
  { symbol: "NTPC.NS", name: "NTPC Ltd." },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corp." },
  { symbol: "POWERGRID.NS", name: "Power Grid Corp." },
  { symbol: "LT.NS", name: "Larsen & Toubro Ltd." },
];

function App() {
  const [symbol, setSymbol] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [marketStatus, setMarketStatus] = useState("Closed");
  const [period, setPeriod] = useState("1mo");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Groww Theme (Light / Dark Mode)
  const theme = React.useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#00d09c', // Groww Teal
        contrastText: '#fff'
      },
      secondary: {
        main: '#eb5b3c', // Red for down trends
      },
      background: {
        default: darkMode ? '#0b0e14' : '#f5f6fa',
        paper: darkMode ? '#151a24' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#e3e6eb' : '#44475b',
        secondary: darkMode ? '#9ba3b0' : '#7c7e8c',
      }
    },
    typography: {
      fontFamily: "'Inter', sans-serif",
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      subtitle1: {
        fontWeight: 500,
      }
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 24px',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: darkMode ? '0 4px 15px rgba(0,0,0,0.3)' : '0 1px 5px rgba(0,0,0,0.05)',
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: darkMode ? '0 6px 20px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
            border: darkMode ? '1px solid #222b3c' : '1px solid #eef0f3',
          }
        }
      }
    },
  }), [darkMode]);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const getMarketStatus = () => {
    const now = new Date();
    const ist = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const day = ist.getDay();
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

  useEffect(() => {
    if (symbol) {
      fetchStock();
    }
  }, [symbol]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.trim().toUpperCase());
    }
  };

  const fetchStock = async () => {
    if (!symbol.trim()) return;

    setLoading(true);
    setError("");
    setData(null);
    setChartData(null);

    try {
      const res = await axios.get(
        `${BASE_URL}/stock/${symbol.trim()}`
      );
      setData(res.data);
      fetchChart(symbol.trim(), res.data, period);
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not fetch stock data"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchChart = async (sym, stockData, selectedPeriod = period) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/stock/${sym}/chart`,
        { params: { period: selectedPeriod } }
      );
      const labels = res.data.data.map((p) => p.label);
      const prices = res.data.data.map((p) => p.price);

      // Determine color based on price change
      const isPositive = stockData ? parseFloat(stockData.change) >= 0 : true;
      const lineColor = isPositive ? "#00d09c" : "#eb5b3c";

      setChartData({
        labels,
        datasets: [
          {
            label: `${sym}`,
            data: prices,
            borderColor: lineColor,
            backgroundColor: (context) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return isPositive ? "rgba(0, 208, 156, 0.05)" : "rgba(235, 91, 60, 0.05)";
              const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, isPositive ? "rgba(0, 208, 156, 0.2)" : "rgba(235, 91, 60, 0.2)");
              gradient.addColorStop(1, "rgba(0, 208, 156, 0)");
              return gradient;
            },
            fill: true,
            borderWidth: 2,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      });
    } catch (e) {
      console.error("Chart fetch failed", e);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (symbol && data) {
      fetchChart(symbol, data, newPeriod);
    }
  };

  const isPositive = data ? parseFloat(data.change) >= 0 : true;

  // Calculate day range position pointer
  let rangePercent = 50;
  if (data && parseFloat(data.high) - parseFloat(data.low) > 0) {
    const low = parseFloat(data.low);
    const high = parseFloat(data.high);
    const price = parseFloat(data.price);
    rangePercent = ((price - low) / (high - low)) * 100;
    rangePercent = Math.max(0, Math.min(100, rangePercent));
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Groww-like Header */}
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: darkMode ? '1px solid #222b3c' : '1px solid #eef0f3', backgroundColor: theme.palette.background.paper }}>
        <Toolbar sx={{ justifyContent: 'space-between', padding: '0 5%' }}>
          <Box display="flex" alignItems="center">
            {/* Minimalist Logo */}
            <Typography variant="h5" color="primary" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              StockSutra
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Box display={{ xs: 'none', md: 'flex' }} alignItems="center">
              <Typography variant="body2" sx={{
                fontWeight: 600,
                color: marketStatus === "Open" ? '#00d09c' : '#7c7e8c',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box component="span" sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: marketStatus === "Open" ? '#00d09c' : '#7c7e8c'
                }} />
                Market {marketStatus}
              </Typography>
            </Box>

            <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
              {darkMode ? <Brightness7Icon sx={{ color: '#ffb300' }} /> : <Brightness4Icon sx={{ color: '#44475b' }} />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        {/* Search Bar using Autocomplete */}
        <Paper
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            p: '2px 8px',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            mb: 4,
            borderRadius: '12px',
            border: darkMode ? '1px solid #222b3c' : '1px solid #eef0f3',
            backgroundColor: theme.palette.background.paper,
            boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease-in-out',
            '&:hover, &:focus-within': {
              boxShadow: darkMode ? '0 6px 24px rgba(0,0,0,0.45)' : '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid #00d09c',
            }
          }}
        >
          <Autocomplete
            freeSolo
            fullWidth
            options={POPULAR_STOCKS}
            getOptionLabel={(option) => typeof option === 'string' ? option : `${option.symbol} - ${option.name}`}
            onChange={(event, newValue) => {
              if (newValue) {
                const val = typeof newValue === 'string' ? newValue : newValue.symbol;
                const symVal = val.toUpperCase();
                setSearchInput(symVal);
                setSymbol(symVal);
              }
            }}
            inputValue={searchInput}
            onInputChange={(event, newInputValue) => {
              setSearchInput(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search stocks e.g. RELIANCE.NS, TCS.NS..."
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <span style={{ marginRight: '8px', fontSize: '1.2rem', color: '#7c7e8c', display: 'flex', alignItems: 'center' }}>🔍</span>
                  ),
                  sx: {
                    fontSize: '1.1rem',
                    py: 0.5,
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  }
                }}
              />
            )}
            sx={{
              width: '100%',
            }}
          />
        </Paper>

        {/* Quick Action Chips */}
        <Box mb={4} display="flex" gap={1.5} flexWrap="wrap">
          {["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "IRFC.NS", "ZOMATO.NS"].map((s) => (
            <Chip
              key={s}
              label={s.replace('.NS', '')}
              onClick={() => {
                setSearchInput(s);
                setSymbol(s);
              }}
              sx={{
                px: 1,
                py: 2.5,
                borderRadius: '8px',
                fontWeight: 500,
                backgroundColor: darkMode ? '#1e2530' : '#ffffff',
                border: darkMode ? '1px solid #2d3848' : '1px solid #eef0f3',
                color: theme.palette.text.primary,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: darkMode ? '#2d3848' : '#f8f9fa',
                  border: '1px solid #00d09c',
                  transform: 'translateY(-2px)',
                  boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.06)'
                }
              }}
            />
          ))}
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" my={5}>
            <CircularProgress size={40} thickness={4} />
          </Box>
        )}

        {error && !loading && (
          <Typography color="error" align="center" variant="h6" my={4}>
            {error}
          </Typography>
        )}

        {/* Stock Details & Chart Layout */}
        {data && !loading && (
          <Grid container spacing={4}>
            {/* Left Column: Price & Chart */}
            <Grid item xs={12} md={8}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" mb={3} gap={2}>
                <Box>
                  <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
                    {data.symbol.replace('.NS', '')}
                  </Typography>

                  <Box display="flex" alignItems="baseline" gap={2}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      ₹{parseFloat(data.price).toFixed(2)}
                    </Typography>
                  </Box>

                  <Typography
                    variant="h6"
                    sx={{
                      color: isPositive ? '#00d09c' : '#eb5b3c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 0.5
                    }}
                  >
                    {isPositive ? '▲ ' : '▼ '}
                    {isPositive ? '+' : ''}{parseFloat(data.change).toFixed(2)} ({isPositive ? '+' : ''}{parseFloat(data.change_percent).toFixed(2)}%)
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {period.toUpperCase().replace('MO', 'M')}
                    </Typography>
                  </Typography>
                </Box>

                {/* Period Selector Tabs */}
                <Box display="flex" gap={0.5} sx={{ mt: { xs: 2, sm: 0 }, bgcolor: darkMode ? '#1e2530' : '#f0f2f5', p: 0.5, borderRadius: '24px' }}>
                  {[
                    { label: "1D", value: "1d" },
                    { label: "5D", value: "5d" },
                    { label: "1M", value: "1mo" },
                    { label: "3M", value: "3mo" },
                    { label: "6M", value: "6mo" },
                    { label: "1Y", value: "1y" },
                    { label: "5Y", value: "5y" }
                  ].map((p) => (
                    <Button
                      key={p.value}
                      onClick={() => handlePeriodChange(p.value)}
                      variant="text"
                      size="small"
                      sx={{
                        minWidth: { xs: '32px', sm: '42px' },
                        padding: '4px 8px',
                        borderRadius: '20px',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        backgroundColor: period === p.value ? '#00d09c' : 'transparent',
                        color: period === p.value ? '#fff' : (darkMode ? '#9ba3b0' : '#7c7e8c'),
                        '&:hover': {
                          backgroundColor: period === p.value ? '#00b085' : (darkMode ? '#2d3848' : '#e4e6eb'),
                          color: period === p.value ? '#fff' : (darkMode ? '#e3e6eb' : '#44475b'),
                        }
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* Chart */}
              {chartData && (
                <Box sx={{ height: 350, width: '100%', mt: 4 }}>
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          mode: 'index',
                          intersect: false,
                          backgroundColor: darkMode ? '#1c222f' : '#ffffff',
                          titleColor: darkMode ? '#e3e6eb' : '#44475b',
                          bodyColor: darkMode ? '#e3e6eb' : '#44475b',
                          borderColor: darkMode ? '#2d3848' : '#eef0f3',
                          borderWidth: 1,
                          padding: 10,
                          displayColors: false,
                          callbacks: {
                            label: function (context) {
                              return '₹' + context.parsed.y.toFixed(2);
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          display: false,
                        },
                        y: {
                          display: false,
                        }
                      },
                      interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                      }
                    }}
                  />
                </Box>
              )}
            </Grid>

            {/* Right Column: Key Stats Grid */}
            <Grid item xs={12} md={4}>
              <Card sx={{
                borderRadius: 4,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: darkMode ? '0 12px 30px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.08)',
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" mb={2}>Performance</Typography>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Today's Low</Typography>
                      <Typography variant="subtitle1">₹{parseFloat(data.low).toFixed(2)}</Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="body2" color="text.secondary">Today's High</Typography>
                      <Typography variant="subtitle1">₹{parseFloat(data.high).toFixed(2)}</Typography>
                    </Box>
                  </Box>

                  {/* Progress bar visual for day's range */}
                  <Box sx={{ width: '100%', height: 6, bgcolor: darkMode ? '#222b3c' : '#eef0f3', borderRadius: 3, mb: 4, mt: 1, position: 'relative' }}>
                    <Box sx={{
                      position: 'absolute',
                      left: `${rangePercent}%`,
                      width: '0',
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderBottom: `8px solid ${darkMode ? '#e3e6eb' : '#44475b'}`,
                      top: -10,
                      transform: 'translateX(-50%)',
                      transition: 'left 0.5s ease-in-out'
                    }} />
                  </Box>

                  <Typography variant="h6" mb={2} mt={1}>Key Metrics</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Open</Typography>
                      <Typography variant="subtitle1">₹{parseFloat(data.open).toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Prev. Close</Typography>
                      <Typography variant="subtitle1">₹{parseFloat(data.previous_close).toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Volume</Typography>
                      <Typography variant="subtitle1">{(data.volume ?? 0).toLocaleString('en-IN')}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Last Traded</Typography>
                      <Typography variant="subtitle1" fontSize="0.85rem" sx={{ wordBreak: 'break-word' }}>{data.latest_trading_day}</Typography>
                    </Grid>
                  </Grid>

                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
