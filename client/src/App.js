import React, { useState, useEffect, useCallback } from "react";
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
  Autocomplete,
  Tooltip,
  Divider,
  Alert,
  Collapse,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
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
  ChartTooltip,
  Legend,
  Filler
);

// ─── Environment-aware API base URL ───────────────────────────────────────────
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://stock-sutra.onrender.com");

// ─── Popular Indian stocks for Autocomplete ────────────────────────────────────
const POPULAR_STOCKS = [
  { symbol: "RELIANCE.NS",   name: "Reliance Industries Ltd." },
  { symbol: "TCS.NS",        name: "Tata Consultancy Services Ltd." },
  { symbol: "INFY.NS",       name: "Infosys Ltd." },
  { symbol: "HDFCBANK.NS",   name: "HDFC Bank Ltd." },
  { symbol: "IRFC.NS",       name: "Indian Railway Finance Corp." },
  { symbol: "ZOMATO.NS",     name: "Zomato Ltd." },
  { symbol: "SBI.NS",        name: "State Bank of India" },
  { symbol: "TATASTEEL.NS",  name: "Tata Steel Ltd." },
  { symbol: "ITC.NS",        name: "ITC Ltd." },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel Ltd." },
  { symbol: "WIPRO.NS",      name: "Wipro Ltd." },
  { symbol: "ICICIBANK.NS",  name: "ICICI Bank Ltd." },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever Ltd." },
  { symbol: "MUTHOOTFIN.NS", name: "Muthoot Finance Ltd." },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd." },
  { symbol: "NTPC.NS",       name: "NTPC Ltd." },
  { symbol: "ONGC.NS",       name: "Oil & Natural Gas Corp." },
  { symbol: "POWERGRID.NS",  name: "Power Grid Corp." },
  { symbol: "LT.NS",         name: "Larsen & Toubro Ltd." },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance Ltd." },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints Ltd." },
  { symbol: "MARUTI.NS",     name: "Maruti Suzuki India Ltd." },
  { symbol: "SUNPHARMA.NS",  name: "Sun Pharmaceutical Industries" },
  { symbol: "ADANIENT.NS",   name: "Adani Enterprises Ltd." },
];

const QUICK_CHIPS = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "IRFC.NS", "ZOMATO.NS"];

const PERIODS = [
  { label: "1D", value: "1d" },
  { label: "5D", value: "5d" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
  { label: "5Y", value: "5y" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────
const formatINR = (num) => {
  if (num == null) return "N/A";
  if (num >= 1e12) return "₹" + (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9)  return "₹" + (num / 1e9).toFixed(2)  + "B";
  if (num >= 1e7)  return "₹" + (num / 1e7).toFixed(2)  + "Cr";
  if (num >= 1e5)  return "₹" + (num / 1e5).toFixed(2)  + "L";
  return "₹" + num.toLocaleString("en-IN");
};

const getMarketStatus = () => {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = ist.getDay();
  const minutes = ist.getHours() * 60 + ist.getMinutes();
  const open  = 9 * 60 + 15;
  const close = 15 * 60 + 30;
  if (day === 0 || day === 6) return "Closed";
  return minutes >= open && minutes <= close ? "Open" : "Closed";
};

// ─── Main App ───────────────────────────────────────────────────────────────────
function App() {
  const [searchInput, setSearchInput] = useState("");
  const [symbol, setSymbol]           = useState("");
  const [data, setData]               = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [chartData, setChartData]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError]             = useState("");
  const [period, setPeriod]           = useState("1mo");
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  const [watchlist, setWatchlist]     = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("watchlist") || "[]");
    } catch {
      return [];
    }
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [infoExpanded, setInfoExpanded] = useState(false);

  // ─── MUI Theme ──────────────────────────────────────────────────────────────
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary:    { main: "#00d09c", contrastText: "#fff" },
          secondary:  { main: "#eb5b3c" },
          background: {
            default: darkMode ? "#0b0e14" : "#f5f6fa",
            paper:   darkMode ? "#151a24" : "#ffffff",
          },
          text: {
            primary:   darkMode ? "#e3e6eb" : "#44475b",
            secondary: darkMode ? "#9ba3b0" : "#7c7e8c",
          },
        },
        typography: {
          fontFamily: "'Inter', sans-serif",
          h4: { fontWeight: 700 },
          h5: { fontWeight: 700 },
          h6: { fontWeight: 600 },
          subtitle1: { fontWeight: 500 },
        },
        shape: { borderRadius: 12 },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                fontWeight: 600,
                padding: "10px 24px",
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                boxShadow: darkMode
                  ? "0 4px 15px rgba(0,0,0,0.3)"
                  : "0 1px 5px rgba(0,0,0,0.05)",
                backgroundImage: "none",
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: darkMode
                  ? "0 6px 20px rgba(0,0,0,0.35)"
                  : "0 2px 8px rgba(0,0,0,0.06)",
                border: darkMode
                  ? "1px solid #222b3c"
                  : "1px solid #eef0f3",
              },
            },
          },
        },
      }),
    [darkMode]
  );

  // ─── Side effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  // Market status: update every minute
  useEffect(() => {
    const timer = setInterval(() => setMarketStatus(getMarketStatus()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ─── Fetch chart (memoised so it can be called safely) ───────────────────────
  const fetchChart = useCallback(async (sym, stockData, selectedPeriod) => {
    setChartLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/stock/${sym}/chart`, {
        params: { period: selectedPeriod },
      });
      const labels = res.data.data.map((p) => p.label);
      const prices = res.data.data.map((p) => p.price);

      const isPos = stockData ? parseFloat(stockData.change) >= 0 : true;
      const lineColor = isPos ? "#00d09c" : "#eb5b3c";
      const gradientTop = isPos
        ? "rgba(0, 208, 156, 0.22)"
        : "rgba(235, 91, 60, 0.22)";
      const gradientBot = isPos
        ? "rgba(0, 208, 156, 0)"
        : "rgba(235, 91, 60, 0)";

      setChartData({
        labels,
        datasets: [
          {
            label: sym,
            data: prices,
            borderColor: lineColor,
            backgroundColor: (context) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return gradientTop;
              const gradient = ctx.createLinearGradient(
                0, chartArea.top, 0, chartArea.bottom
              );
              gradient.addColorStop(0, gradientTop);
              gradient.addColorStop(1, gradientBot);
              return gradient;
            },
            fill: true,
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: lineColor,
          },
        ],
      });
    } catch (e) {
      console.error("Chart fetch failed:", e);
      setChartData(null);
    } finally {
      setChartLoading(false);
    }
  }, []);

  // ─── Fetch stock data ────────────────────────────────────────────────────────
  const fetchStock = useCallback(
    async (sym, selectedPeriod) => {
      const cleanSym = sym.trim().toUpperCase();
      if (!cleanSym) return;

      setLoading(true);
      setError("");
      setData(null);
      setChartData(null);
      setCompanyInfo(null);
      setInfoExpanded(false);

      try {
        const res = await axios.get(`${BASE_URL}/stock/${cleanSym}`);
        setData(res.data);
        // Fire chart and info fetch in parallel
        fetchChart(cleanSym, res.data, selectedPeriod);
        axios.get(`${BASE_URL}/stock/${cleanSym}/info`)
          .then((infoRes) => setCompanyInfo(infoRes.data))
          .catch(() => setCompanyInfo(null));
      } catch (err) {
        const msg =
          err.response?.data?.error || "Could not fetch stock data. Please try again.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [fetchChart]
  );

  // Re-fetch when symbol changes
  useEffect(() => {
    if (symbol) {
      fetchStock(symbol, period);
    }
    // eslint-disable-next-line
  }, [symbol]);

  // ─── Event handlers ──────────────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim().toUpperCase();
    if (!trimmed) return;
    if (trimmed === symbol) {
      // Same symbol — force a refresh
      fetchStock(trimmed, period);
    } else {
      setSymbol(trimmed);
    }
  };

  const handleAutocompleteSelect = (newValue) => {
    if (!newValue) return;
    const val =
      typeof newValue === "string" ? newValue : newValue.symbol;
    const sym = val.toUpperCase();
    setSearchInput(sym);
    setSymbol(sym);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (symbol && data) {
      fetchChart(symbol, data, newPeriod);
    }
  };

  const handleRefresh = () => {
    if (symbol) fetchStock(symbol, period);
  };

  const toggleWatchlist = (sym) => {
    setWatchlist((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  // ─── Derived values ──────────────────────────────────────────────────────────
  const isPositive = data ? parseFloat(data.change) >= 0 : true;
  const isWatched  = watchlist.includes(symbol);

  let rangePercent = 50;
  if (data) {
    const low   = parseFloat(data.low);
    const high  = parseFloat(data.high);
    const price = parseFloat(data.price);
    if (high - low > 0) {
      rangePercent = Math.max(0, Math.min(100, ((price - low) / (high - low)) * 100));
    }
  }

  // ─── Shared sx helpers ───────────────────────────────────────────────────────
  const cardSx = {
    borderRadius: 4,
    transition: "all 0.3s ease-in-out",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: darkMode
        ? "0 12px 30px rgba(0,0,0,0.5)"
        : "0 8px 24px rgba(0,0,0,0.1)",
    },
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* ── AppBar ── */}
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: darkMode ? "1px solid #222b3c" : "1px solid #eef0f3",
          backgroundColor: theme.palette.background.paper,
          backdropFilter: "blur(8px)",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: "5%" } }}>
          {/* Brand */}
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #00d09c 0%, #00a87e 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUpIcon sx={{ color: "#fff", fontSize: 18 }} />
            </Box>
            <Typography
              variant="h5"
              color="primary"
              sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}
            >
              StockSutra
            </Typography>
          </Box>

          {/* Right: market status + dark mode */}
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              display={{ xs: "none", sm: "flex" }}
              alignItems="center"
              gap={1}
            >
              <Box
                component="span"
                className={marketStatus === "Open" ? "live-dot" : ""}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor:
                    marketStatus === "Open" ? "#00d09c" : "#7c7e8c",
                  display: "inline-block",
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: marketStatus === "Open" ? "#00d09c" : "#7c7e8c",
                }}
              >
                NSE {marketStatus}
              </Typography>
            </Box>

            <Tooltip title={darkMode ? "Light mode" : "Dark mode"}>
              <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit" size="small">
                {darkMode ? (
                  <Brightness7Icon sx={{ color: "#ffb300" }} />
                ) : (
                  <Brightness4Icon />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>

        {/* ── Search bar ── */}
        <Paper
          component="form"
          onSubmit={handleSearchSubmit}
          elevation={0}
          sx={{
            p: "4px 8px 4px 16px",
            display: "flex",
            alignItems: "center",
            mb: 3,
            borderRadius: "14px",
            border: darkMode ? "1px solid #222b3c" : "1px solid #e4e6eb",
            backgroundColor: theme.palette.background.paper,
            boxShadow: darkMode
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : "0 2px 12px rgba(0,0,0,0.06)",
            transition: "all 0.2s ease-in-out",
            "&:hover, &:focus-within": {
              boxShadow: darkMode
                ? "0 6px 28px rgba(0,0,0,0.45)"
                : "0 4px 20px rgba(0,208,156,0.12)",
              border: "1px solid #00d09c",
            },
          }}
        >
          {/* Search emoji */}
          <Box component="span" sx={{ fontSize: "1.15rem", mr: 1, color: "#7c7e8c", flexShrink: 0 }}>
            🔍
          </Box>

          <Autocomplete
            freeSolo
            fullWidth
            options={POPULAR_STOCKS}
            getOptionLabel={(option) =>
              typeof option === "string"
                ? option
                : `${option.symbol} – ${option.name}`
            }
            onChange={(_, newValue) => handleAutocompleteSelect(newValue)}
            inputValue={searchInput}
            onInputChange={(_, newVal) => setSearchInput(newVal)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search stocks e.g. RELIANCE.NS, TCS.NS…"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  sx: {
                    fontSize: "1rem",
                    py: 0.5,
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  },
                }}
              />
            )}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disableElevation
            sx={{
              borderRadius: "10px",
              ml: 1,
              px: 3,
              py: 1,
              flexShrink: 0,
              fontSize: "0.9rem",
            }}
          >
            Search
          </Button>
        </Paper>

        {/* ── Quick chips ── */}
        <Box mb={4} display="flex" gap={1} flexWrap="wrap">
          {QUICK_CHIPS.map((s) => (
            <Chip
              key={s}
              label={s.replace(".NS", "")}
              onClick={() => {
                setSearchInput(s);
                setSymbol(s);
              }}
              sx={{
                px: 0.5,
                py: 2.5,
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.8rem",
                backgroundColor: symbol === s
                  ? (darkMode ? "rgba(0,208,156,0.15)" : "rgba(0,208,156,0.1)")
                  : (darkMode ? "#1e2530" : "#ffffff"),
                border: symbol === s
                  ? "1px solid #00d09c"
                  : (darkMode ? "1px solid #2d3848" : "1px solid #eef0f3"),
                color: symbol === s ? "#00d09c" : theme.palette.text.primary,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: darkMode ? "#2d3848" : "#f0fdf9",
                  border: "1px solid #00d09c",
                  transform: "translateY(-2px)",
                  boxShadow: darkMode
                    ? "0 4px 12px rgba(0,0,0,0.4)"
                    : "0 2px 8px rgba(0,208,156,0.15)",
                },
              }}
            />
          ))}
        </Box>

        {/* ── Watchlist chips ── */}
        {watchlist.length > 0 && (
          <Box mb={3}>
            <Typography variant="body2" color="text.secondary" mb={1} fontWeight={600}>
              📌 Watchlist
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {watchlist.map((s) => (
                <Chip
                  key={s}
                  label={s.replace(".NS", "")}
                  onClick={() => { setSearchInput(s); setSymbol(s); }}
                  onDelete={() => toggleWatchlist(s)}
                  size="small"
                  sx={{
                    borderRadius: "6px",
                    fontWeight: 600,
                    backgroundColor: darkMode ? "#1e2530" : "#f8f9fa",
                    border: darkMode ? "1px solid #2d3848" : "1px solid #eef0f3",
                    "&:hover": { border: "1px solid #00d09c" },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* ── Loading spinner ── */}
        {loading && (
          <Box display="flex" flexDirection="column" alignItems="center" my={8} gap={2}>
            <CircularProgress size={44} thickness={4} color="primary" />
            <Typography color="text.secondary" variant="body2">
              Fetching live data…
            </Typography>
          </Box>
        )}

        {/* ── Error alert ── */}
        {error && !loading && (
          <Alert
            severity="error"
            variant="outlined"
            sx={{ borderRadius: 3, my: 4 }}
            action={
              <Button size="small" color="error" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* ── Welcome hero (shown before any search) ── */}
        {!data && !loading && !error && (
          <Box
            className="fade-in"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            py={8}
            gap={2}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "20px",
                background: "linear-gradient(135deg, #00d09c 0%, #0096c7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1,
                boxShadow: "0 12px 32px rgba(0,208,156,0.25)",
              }}
            >
              <TrendingUpIcon sx={{ color: "#fff", fontSize: 40 }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>
              Track Any Indian Stock
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              maxWidth={420}
              lineHeight={1.7}
            >
              Search for any NSE-listed stock above, or click a quick chip to get
              started. Get live prices, charts & key metrics instantly.
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center" mt={1}>
              {["📈 Real-time prices", "📊 Interactive charts", "📌 Watchlist", "🌙 Dark mode"].map(
                (f) => (
                  <Chip
                    key={f}
                    label={f}
                    size="small"
                    sx={{
                      fontWeight: 500,
                      backgroundColor: darkMode ? "#1e2530" : "#f0fdf9",
                      border: "1px solid #00d09c",
                      color: "#00d09c",
                    }}
                  />
                )
              )}
            </Box>
          </Box>
        )}

        {/* ── Main data layout ── */}
        {data && !loading && (
          <Box className="fade-in-up">
            <Grid container spacing={3}>

              {/* ── Left: Price, Change, Chart ── */}
              <Grid item xs={12} md={8}>

                {/* Stock title row */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  flexWrap="wrap"
                  mb={2}
                  gap={2}
                >
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h4" color="text.primary">
                        {data.symbol.replace(".NS", "")}
                      </Typography>
                      <Chip
                        label="NSE"
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          backgroundColor: darkMode ? "#1e2530" : "#f0f2f5",
                          color: "text.secondary",
                        }}
                      />
                      <Tooltip title={isWatched ? "Remove from watchlist" : "Add to watchlist"}>
                        <IconButton
                          size="small"
                          onClick={() => toggleWatchlist(symbol)}
                          sx={{ color: isWatched ? "#00d09c" : "text.secondary" }}
                        >
                          {isWatched ? (
                            <BookmarkIcon fontSize="small" />
                          ) : (
                            <BookmarkBorderIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Refresh">
                        <IconButton size="small" onClick={handleRefresh} color="inherit">
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {companyInfo?.company_name && (
                      <Typography variant="body2" color="text.secondary" mt={0.25}>
                        {companyInfo.company_name}
                      </Typography>
                    )}

                    {/* Price */}
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 800, mt: 1, letterSpacing: "-1px" }}
                    >
                      ₹{parseFloat(data.price).toFixed(2)}
                    </Typography>

                    {/* Change */}
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      {isPositive ? (
                        <TrendingUpIcon sx={{ color: "#00d09c", fontSize: 20 }} />
                      ) : (
                        <TrendingDownIcon sx={{ color: "#eb5b3c", fontSize: 20 }} />
                      )}
                      <Typography
                        variant="h6"
                        sx={{ color: isPositive ? "#00d09c" : "#eb5b3c" }}
                      >
                        {isPositive ? "+" : ""}
                        {parseFloat(data.change).toFixed(2)} (
                        {isPositive ? "+" : ""}
                        {parseFloat(data.change_percent).toFixed(2)}%)
                      </Typography>
                    </Box>
                  </Box>

                  {/* Period selector */}
                  <Box
                    display="flex"
                    gap={0.5}
                    sx={{
                      mt: { xs: 1, sm: 0 },
                      bgcolor: darkMode ? "#1e2530" : "#f0f2f5",
                      p: 0.5,
                      borderRadius: "24px",
                      alignSelf: "flex-start",
                    }}
                  >
                    {PERIODS.map((p) => (
                      <Button
                        key={p.value}
                        onClick={() => handlePeriodChange(p.value)}
                        variant="text"
                        size="small"
                        sx={{
                          minWidth: { xs: "30px", sm: "40px" },
                          padding: "4px 8px",
                          borderRadius: "20px",
                          fontWeight: 600,
                          fontSize: "0.78rem",
                          backgroundColor:
                            period === p.value ? "#00d09c" : "transparent",
                          color:
                            period === p.value
                              ? "#fff"
                              : darkMode
                              ? "#9ba3b0"
                              : "#7c7e8c",
                          "&:hover": {
                            backgroundColor:
                              period === p.value
                                ? "#00b085"
                                : darkMode
                                ? "#2d3848"
                                : "#e4e6eb",
                            color:
                              period === p.value
                                ? "#fff"
                                : darkMode
                                ? "#e3e6eb"
                                : "#44475b",
                          },
                        }}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </Box>
                </Box>

                {/* Chart area */}
                <Box
                  sx={{
                    height: 300,
                    width: "100%",
                    mt: 2,
                    position: "relative",
                    borderRadius: 3,
                    overflow: "hidden",
                    backgroundColor: darkMode
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(0,0,0,0.01)",
                    border: darkMode ? "1px solid #1e2530" : "1px solid #f0f2f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {chartLoading ? (
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <CircularProgress size={28} thickness={4} color="primary" />
                      <Typography variant="caption" color="text.secondary">
                        Loading chart…
                      </Typography>
                    </Box>
                  ) : chartData ? (
                    <Box sx={{ position: "absolute", inset: 0, p: 1 }}>
                      <Line
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          animation: { duration: 600 },
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              mode: "index",
                              intersect: false,
                              backgroundColor: darkMode ? "#1c222f" : "#ffffff",
                              titleColor: darkMode ? "#e3e6eb" : "#44475b",
                              bodyColor: darkMode ? "#e3e6eb" : "#44475b",
                              borderColor: darkMode ? "#2d3848" : "#eef0f3",
                              borderWidth: 1,
                              padding: 10,
                              displayColors: false,
                              callbacks: {
                                label: (context) =>
                                  "₹" + context.parsed.y.toFixed(2),
                              },
                            },
                          },
                          scales: {
                            x: { display: false },
                            y: { display: false },
                          },
                          interaction: {
                            mode: "nearest",
                            axis: "x",
                            intersect: false,
                          },
                          elements: {
                            line: { borderCapStyle: "round" },
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Chart data unavailable for this period.
                    </Typography>
                  )}
                </Box>

                {/* Last traded */}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  textAlign="right"
                  mt={1}
                >
                  Last updated: {data.latest_trading_day}
                </Typography>
              </Grid>

              {/* ── Right: Stats ── */}
              <Grid item xs={12} md={4}>
                <Card sx={cardSx}>
                  <CardContent sx={{ p: 3 }}>
                    {/* Day range */}
                    <Typography variant="h6" mb={2}>
                      Today's Range
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Low</Typography>
                        <Typography variant="subtitle1" sx={{ color: "#eb5b3c", fontWeight: 700 }}>
                          ₹{parseFloat(data.low).toFixed(2)}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="caption" color="text.secondary">High</Typography>
                        <Typography variant="subtitle1" sx={{ color: "#00d09c", fontWeight: 700 }}>
                          ₹{parseFloat(data.high).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Range bar */}
                    <Box sx={{ position: "relative", mb: 4, mt: 1 }}>
                      <Box
                        sx={{
                          width: "100%",
                          height: 6,
                          borderRadius: 3,
                          background: `linear-gradient(to right, #eb5b3c, #00d09c)`,
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          left: `${rangePercent}%`,
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          backgroundColor: theme.palette.background.paper,
                          border: `2.5px solid ${isPositive ? "#00d09c" : "#eb5b3c"}`,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                          transition: "left 0.6s cubic-bezier(.4,0,.2,1)",
                        }}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Key metrics grid */}
                    <Typography variant="h6" mb={2}>
                      Key Metrics
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        { label: "Open",       value: `₹${parseFloat(data.open).toFixed(2)}` },
                        { label: "Prev. Close",value: `₹${parseFloat(data.previous_close).toFixed(2)}` },
                        { label: "Volume",     value: (data.volume ?? 0).toLocaleString("en-IN") },
                        { label: "Change %",   value: `${isPositive ? "+" : ""}${parseFloat(data.change_percent).toFixed(2)}%`, color: isPositive ? "#00d09c" : "#eb5b3c" },
                      ].map(({ label, value, color }) => (
                        <Grid item xs={6} key={label}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {label}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, color: color || "text.primary" }}
                          >
                            {value}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>

                    {/* Extended company info */}
                    {companyInfo && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          onClick={() => setInfoExpanded((p) => !p)}
                          sx={{ cursor: "pointer" }}
                        >
                          <Typography variant="h6">Company Info</Typography>
                          <InfoOutlinedIcon fontSize="small" color="action" />
                        </Box>
                        <Collapse in={infoExpanded}>
                          <Grid container spacing={1.5} mt={0.5}>
                            {[
                              { label: "Sector",      value: companyInfo.sector },
                              { label: "Market Cap",  value: formatINR(companyInfo.market_cap) },
                              { label: "P/E Ratio",   value: companyInfo.pe_ratio?.toFixed(2) ?? "N/A" },
                              { label: "EPS",         value: companyInfo.eps?.toFixed(2) ?? "N/A" },
                              { label: "52W High",    value: companyInfo.fifty_two_week_high ? `₹${companyInfo.fifty_two_week_high.toFixed(2)}` : "N/A" },
                              { label: "52W Low",     value: companyInfo.fifty_two_week_low  ? `₹${companyInfo.fifty_two_week_low.toFixed(2)}`  : "N/A" },
                            ].map(({ label, value }) => (
                              <Grid item xs={6} key={label}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {label}
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {value}
                                </Typography>
                              </Grid>
                            ))}
                          </Grid>
                          {companyInfo.description && companyInfo.description !== "N/A" && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              mt={1.5}
                              lineHeight={1.6}
                            >
                              {companyInfo.description}
                            </Typography>
                          )}
                        </Collapse>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>

      {/* ── Footer ── */}
      <Box
        component="footer"
        sx={{
          textAlign: "center",
          py: 3,
          borderTop: darkMode ? "1px solid #1e2530" : "1px solid #eef0f3",
          mt: "auto",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          StockSutra · Data via yFinance · Built by{" "}
          <Box
            component="a"
            href="https://github.com/VINAY-TEJA-29"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "#00d09c", textDecoration: "none", fontWeight: 600 }}
          >
            Vinay Teja
          </Box>
        </Typography>
      </Box>
    </ThemeProvider>
  );
}

export default App;
