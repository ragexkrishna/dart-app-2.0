import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion as Motion } from "framer-motion";
import api from "../api/axios";
import AlertBanner from "../components/ui/AlertBanner";
import { loginSuccess } from "../features/authSlice";
import shardaLogo     from "../assets/sharda-logo.jpg";
import shardaWorkshop from "../assets/sharda_workshop.png";
import dartLogo       from "../assets/Dart_logo.jpeg";

export default function Login() {
  const [email, setEmail]           = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword]     = useState("");
  const [loginType, setLoginType]   = useState("student");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [participantCount, setParticipantCount] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Load registered participants count from Google Sheet (participants_rows)
  useEffect(() => {
    let cancelled = false;
    fetch("https://opensheet.elk.sh/1ukomuNdIHHhrmETeZgUNuYuVFYsCG4b-CqdkNw1VTBY/participant_rows")
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("Failed to load sheet")))
      .then((rows) => {
        if (cancelled) return;
        if (Array.isArray(rows)) {
          setParticipantCount(rows.length);
        }
      })
      .catch(() => {
        if (!cancelled) setParticipantCount(null);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = loginType === "admin" 
        ? { email, password, role: "admin" } 
        : { email, rollNumber, role: "student" };

      const res = await api.post("/auth/login", payload);

      localStorage.setItem("name", res.data.name);
      localStorage.setItem("email", res.data.email);
      if (res.data.rollNumber) {
        localStorage.setItem("roll_number", res.data.rollNumber);
      }
      
      // Update Redux state directly 
      dispatch(loginSuccess({
        token: res.data.token,
        role: res.data.role || "student"
      }));

      // Redirect based on role
      if (res.data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/student");
      }

    } catch (err) {
      console.error(err);
      setError(
        loginType === "admin" 
          ? "Invalid email or password. Please try again." 
          : "Invalid email or roll number. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Motion.div
      className="min-h-screen flex bg-[#F8FAFC] relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >

      {/*  Left branding panel  */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[46%] flex-col justify-between
        p-12 bg-[#1E3A8A] relative overflow-hidden"
        style={{
          backgroundImage: `url(${shardaWorkshop})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>

        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(10,18,40,0.82) 0%, rgba(30,58,138,0.76) 100%)",
          }} />

        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)," +
              "linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }} />

        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at top right, rgba(15,23,42,0.45), transparent 55%)",
          }} />

<div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <img
              src={shardaLogo}
              alt="Sharda University"
              className="h-14 md:h-16 w-auto object-contain pointer-events-none rounded-md bg-white p-2"
            />
            <div className="flex items-center gap-3">
              <img
                src={dartLogo}
                alt="DART"
                className="h-14 md:h-16 w-auto object-contain flex-shrink-0"
                style={{ filter: "drop-shadow(0 1px 6px rgba(0,0,0,0.35))" }}
              />
              <div>
                <p className="text-white font-bold text-base leading-tight">DART 2K26</p>
              </div>
            </div>
          </div>

          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-snug mb-4">
            Drone, Robotics<br />&amp; IoT Workshop
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed max-w-sm">
            Annual inter-university competition and technical workshop
            organized by the Sharda School of Engineering and Technology, Sharda University.
          </p>
        </div>

        <div className="relative z-10 space-y-2.5">
          <p className="text-blue-300 text-[11px] font-semibold uppercase tracking-widest mb-3">
            Event Overview
          </p>
          {[
            {
              label: "Registered Participants",
              value: participantCount != null ? String(participantCount) : "—",
              cls: "text-blue-200",
            },
            { label: "Workshop Sessions",       value: "11",   cls: "text-purple-300" },
          ].map((m) => (
            <div key={m.label}
              className="flex items-center justify-between px-4 py-2.5
                border border-white/20 rounded-lg bg-white/10">
              <span className="text-blue-200 text-sm">{m.label}</span>
              <span className={`font-bold ${m.cls}`}>{m.value}</span>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-blue-300/60 text-xs text-center">
          March 20-26, 2026 | Greater Noida, Uttar Pradesh
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-14 bg-[#F8FAFC]">

        <div className="w-full max-w-[390px] animate-fade-in">

          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <img
              src={dartLogo}
              alt="DART"
              className="h-9 w-auto object-contain flex-shrink-0"
              style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.15))" }}
            />
            <div>
              <p className="text-[#0F172A] font-bold leading-tight text-sm">DART 2K26</p>
              <p className="text-[#475569] text-[10px] uppercase tracking-widest">Sharda University</p>
            </div>
          </div>

          <div className="flex bg-[#E2E8F0] p-1 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => { setLoginType("student"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                loginType === "student" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748b] hover:bg-white/50"
              }`}
            >
              Participant
            </button>
            <button
              type="button"
              onClick={() => { setLoginType("admin"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                loginType === "admin" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748b] hover:bg-white/50"
              }`}
            >
              Administrator
            </button>
          </div>

          <h2 className="text-xl font-bold text-[#0F172A] mb-1">
            {loginType === "student" ? "Participant Sign In" : "Admin Sign In"}
          </h2>
          <p className="text-[#64748b] text-sm mb-7">
            {loginType === "student" ? "Access your participant dashboard" : "Access the management console"}
          </p>

          {error && (
            <div className="mb-5">
              <AlertBanner variant="error" onClose={() => setError("")}>{error}</AlertBanner>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#64748b] text-[11px] font-semibold uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <input
                className="dart-input"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {loginType === "student" ? (
              <div>
                <label className="block text-[#64748b] text-[11px] font-semibold uppercase tracking-widest mb-1.5">
                  Roll Number / Participant ID
                </label>
                <input
                  className="dart-input"
                  type="text"
                  placeholder="e.g. DART-2026-0042"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[#64748b] text-[11px] font-semibold uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <input
                  className="dart-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 text-sm mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-[#64748b]">
            New participant?{" "}
            <a
              href="/register"
              className="text-[#1E3A8A] hover:text-[#1D4ED8] font-medium transition-colors"
            >
              Create an account
            </a>
          </p>

          <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
            <p className="text-[#94A3B8] text-xs text-center">
              Sharda University | Sharda School of Engineering and Technology <br />
              For support, contact the event coordinator.
            </p>
          </div>

        </div>
      </div>
    </Motion.div>
  );
}