import { useState } from "react";
import { Compass, Menu, X } from "lucide-react";
import "./Navbar.css";

const links = [
  { href: "#plan", label: "Plan a trip" },
  { href: "#destinations", label: "Destinations" },
  { href: "#features", label: "Why Voyagea" },
];

function Navbar({ onLogin, onRegister, onHome, isLoggedIn, onLogout, user }) {
  const [showProfile, setShowProfile] = useState(false);
  const [open, setOpen] = useState(false);

  const userName = user?.name || user?.full_name || user?.username || "User";

  const firstLetter = userName.charAt(0).toUpperCase();

  function closeMenu() {
    setOpen(false);
  }

  function handleLogout() {
    setShowProfile(false);
    closeMenu();
    onLogout?.();
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a
          className="brand"
          href="#top"
          aria-label="Voyagea home"
          onClick={(e) => {
            e.preventDefault();
            onHome?.();
            closeMenu();
            setShowProfile(false);
          }}
        >
          <span className="brand-mark">
            <Compass size={20} />
          </span>
          Voyagea
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <ul className={`nav-links ${open ? "open" : ""}`}>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={closeMenu}>
                {link.label}
              </a>
            </li>
          ))}

          {isLoggedIn ? (
            <li className="profile-container">
              <button
                className="profile-avatar"
                type="button"
                aria-label="Open profile menu"
                aria-expanded={showProfile}
                onClick={() => setShowProfile((value) => !value)}
              >
                {firstLetter}
              </button>

              {showProfile && (
                <div className="profile-dropdown">
                  <div className="profile-name">{userName}</div>

                  <button
                    className="dropdown-logout"
                    type="button"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </li>
          ) : (
            <>
              <li>
                <button
                  className="nav-auth"
                  type="button"
                  onClick={() => {
                    onLogin?.();
                    closeMenu();
                  }}
                >
                  Login
                </button>
              </li>

              <li>
                <button
                  className="nav-cta"
                  type="button"
                  onClick={() => {
                    onRegister?.();
                    closeMenu();
                  }}
                >
                  Sign up
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </header>
  );
}

export default Navbar;
