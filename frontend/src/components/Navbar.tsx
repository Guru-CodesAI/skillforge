import { Link, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">
        ⚡ SkillForge
      </Link>
      <div className="navbar__links">
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/teammates">Teammates</Link>
            <Link to="/admin">Admin</Link>
            <button className="navbar__logout" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};
