import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }

      setLoading(false);
      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  // Handle auth state changes
  useEffect(() => {
    if (!isInitialized) return;

    if (user && token) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [user, token, isInitialized]);

  // Handle protected routes and redirections
  useEffect(() => {
    if (!isInitialized || loading) return;

    const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
    const isDashboardPage = location.pathname.includes("/dashboard");

    if (!user && isDashboardPage) {
      navigate("/login", { replace: true });
    } else if (user && isAuthPage) {
      const dashboardPath = getDashboardPath(user.role);
      navigate(dashboardPath, { replace: true });
    }
  }, [user, location.pathname, isInitialized, loading, navigate]);

  const getDashboardPath = (role) => {
    switch (role) {
      case "super_admin":
        return "/dashboard/super-admin";
      case "admin":
        return "/dashboard/admin";
      case "doctor":
        return "/dashboard/doctor";
      default:
        return "/dashboard/user";
    }
  };

  const login = async ({ username, password }) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Login failed");
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);

      const dashboardPath = getDashboardPath(data.user.role);
      navigate(dashboardPath, { replace: true });
    } catch (err) {
      console.error("Login error:", err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async ({ username, email, password }) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Signup failed");
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);

      const dashboardPath = getDashboardPath(data.user.role);
      navigate(dashboardPath, { replace: true });
    } catch (err) {
      console.error("Signup error:", err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    loading,
    isInitialized,
  };

  if (!isInitialized) {
    return null; // or a loading spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
