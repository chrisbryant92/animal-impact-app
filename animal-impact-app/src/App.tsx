import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";

// Types
interface User {
  id: number;
  email: string;
  name: string;
}

interface DashboardData {
  user: User;
  stats: {
    totalDonations: number;
    conversionCount: number;
    mediaCount: number;
    totalReach: number;
    campaignCount: number;
    animalsImpact: number;
  };
  recent: {
    donations: any[];
    conversions: any[];
    media: any[];
    campaigns: any[];
  };
}

// Auth Context
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, name: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API utilities
const API_BASE = window.location.origin.includes('localhost') 
  ? 'http://localhost:3001/api' 
  : '/api';

const api = {
  async post(endpoint: string, data: any, token?: string) {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  },

  async get(endpoint: string, token: string) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  }
};

// Auth Provider
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.post('/login', { email, password });
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, name: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.post('/register', { email, name, password });
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Simple UI Components
const Button = ({ 
  children, 
  onClick, 
  type = "button", 
  disabled = false, 
  variant = "primary",
  size = "md",
  className = ""
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const baseClasses = "font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  required = false,
  placeholder = "",
  className = ""
}: {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

const Card = ({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

// Landing Page
function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Animal Impact</h1>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Animal Saving Calculator
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Track and visualize your real-world impact on animal welfare
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Tracking Impact
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Track Your Impact on Animal Welfare
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Animal Impact helps you quantify how your daily actions and choices contribute to saving animals around the world.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Charitable Donations</h3>
              <p className="text-gray-600">
                Log your contributions to animal welfare organizations and see your impact.
              </p>
            </Card>

            <Card className="p-6 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-600 text-xl">🌱</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Monitor Vegan Conversions</h3>
              <p className="text-gray-600">
                Record your influence on others' dietary choices and calculate animals saved.
              </p>
            </Card>

            <Card className="p-6 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-600 text-xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Document Media Shared</h3>
              <p className="text-gray-600">
                Track advocacy content you've shared and its influence on animal welfare.
              </p>
            </Card>

            <Card className="p-6 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-orange-600 text-xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Measure Campaign Impact</h3>
              <p className="text-gray-600">
                Log your participation in animal welfare campaigns and see collective results.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

// Auth Page
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();

  const fillDemoAccount = () => {
    setEmail("johndoe@gmail.com");
    setPassword("password123");
    setName("John Doe");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const success = isLogin 
      ? await login(email, password)
      : await register(email, name, password);

    if (success) {
      navigate("/dashboard");
    } else {
      setError(isLogin ? "Invalid credentials" : "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="block text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Animal Impact</h1>
        </Link>
        <p className="text-center text-gray-600 mb-8">
          Track your contribution to animal welfare
        </p>

        <Card className="p-6">
          <div className="flex mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-center rounded-l-md ${
                isLogin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-center rounded-r-md ${
                !isLogin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Register
            </button>
          </div>

          {/* Demo Account Button */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-2">
              <strong>Demo:</strong> Click below to fill demo account credentials
            </p>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={fillDemoAccount}
            >
              Use Demo Account
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {!isLogin && (
              <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
            )}
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : (isLogin ? "Log In" : "Create Account")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

// Dashboard Page
function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, logout } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!token) return;
      
      try {
        const dashboardData = await api.get('/dashboard', token);
        setData(dashboardData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your impact data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Animal Impact Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {data.user.name}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Animal Welfare Impact</h2>
          <p className="text-gray-600">Track and measure your contribution to animal welfare causes</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Donations</h3>
            <div className="text-2xl font-bold text-green-600">${data.stats.totalDonations.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Lifetime contributions</p>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Vegan Conversions</h3>
            <div className="text-2xl font-bold text-blue-600">{data.stats.conversionCount} people</div>
            <p className="text-xs text-gray-500">≈ {data.stats.animalsImpact.toLocaleString()} animals saved/year</p>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Content Shared</h3>
            <div className="text-2xl font-bold text-purple-600">{data.stats.mediaCount} posts</div>
            <p className="text-xs text-gray-500">Reached {data.stats.totalReach.toLocaleString()}+ people</p>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Campaign Impact</h3>
            <div className="text-2xl font-bold text-orange-600">{data.stats.campaignCount} campaigns</div>
            <p className="text-xs text-gray-500">Policy changes supported</p>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-blue-600">💰</span>
              Recent Donations
            </h3>
            <div className="space-y-3">
              {data.recent.donations.slice(0, 3).map((donation: any) => (
                <div key={donation.id} className="flex justify-between items-center">
                  <span className="text-sm">{donation.organization}</span>
                  <span className="font-medium">${donation.amount}</span>
                </div>
              ))}
              {data.recent.donations.length === 0 && (
                <p className="text-gray-500 text-sm">No donations recorded yet</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-green-600">🌱</span>
              Impact Calculator
            </h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Your dietary influence has resulted in:
              </div>
              <div className="text-lg font-semibold text-green-600">
                ≈ {data.stats.animalsImpact.toLocaleString()} animals saved annually
              </div>
              <div className="text-sm text-gray-500">
                Based on {data.stats.conversionCount} vegan conversions × 365 animals/person/year
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/auth" />;
}

// Main App
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}