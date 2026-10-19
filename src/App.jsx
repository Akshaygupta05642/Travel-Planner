import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TripPlannerForm from "./components/TripPlannerForm";
import Destinations from "./components/Destinations";
import Features from "./components/Features";
import Footer from "./components/Footer";
import Login from "./pages/login";
import Register from "./pages/register";

function App() {
  const [presetDestination, setPresetDestination] = useState("");
  const [page, setPage] = useState("home");

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem("access_token"));
  });

  const [user, setUser] = useState(null);

  // Load logged-in user's details, including after page refresh
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setUser(null);
        setIsLoggedIn(false);
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("access_token");
          setUser(null);
          setIsLoggedIn(false);
          return;
        }

        const data = await response.json();
        setUser(data);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Could not load user:", error);
      }
    }

    loadUser();
  }, []);

  function handleSelectDestination(name) {
    setPresetDestination(name);
    document.getElementById("plan")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  function navigate(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleLoginSuccess(data) {
    setIsLoggedIn(true);
    navigate("home");

    try {
      const token = data?.access_token || localStorage.getItem("access_token");

      const response = await fetch("http://127.0.0.1:8000/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Could not load user profile");
      }

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error("User profile error:", error);
    }
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    setUser(null);
    navigate("home");
  }

  return (
    <>
      <Navbar
        onLogin={() => navigate("login")}
        onRegister={() => navigate("register")}
        onHome={() => navigate("home")}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        user={user}
      />

      {page === "home" && (
        <>
          <main>
            <Hero />
            <TripPlannerForm presetDestination={presetDestination} />
            <Destinations onSelect={handleSelectDestination} />
            <Features />
          </main>
          <Footer />
        </>
      )}

      {page === "login" && (
        <Login
          onLogin={handleLoginSuccess}
          onRegister={() => navigate("register")}
        />
      )}

      {page === "register" && (
        <Register
          onRegister={() => navigate("login")}
          onLogin={() => navigate("login")}
        />
      )}
    </>
  );
}

export default App;
