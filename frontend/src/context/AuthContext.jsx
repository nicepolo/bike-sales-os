import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/auth/me")
      .then((res) => setUsername(res.data.username))
      .finally(() => setLoading(false));
  }, []);

  async function login(u, p) {
    const res = await client.post("/auth/login", { username: u, password: p });
    setUsername(res.data.username);
  }

  async function logout() {
    await client.post("/auth/logout");
    setUsername(null);
  }

  return (
    <AuthContext.Provider value={{ username, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
