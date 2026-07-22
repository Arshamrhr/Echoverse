import { useState, useEffect, useRef, useContext, createContext } from "react";
import {
  Play,
  Pause,
  Star,
  MessageCircle,
  Send,
  Disc3,
  User,
  LogIn,
  LogOut,
  X,
  Heart,
  Crown,
} from "lucide-react";
import treeBranch from "./assets/tree-branch.png";
import { login, register, logout, loadSession } from "./auth";
import { fetchComments, postComment, likeComment, fetchTopComment } from "./api";

// Add your own poster image URL to each entry's `poster` field, e.g. "/posters/aot.jpg"
const ANIMES = [
  { id: "aot", title: "Attack on Titan", glyph: "巨", hue: 14, year: "2013", poster: "",
    songs: [
      { name: "Guren no Yumiya", type: "OP 1", duration: 89 },
      { name: "Jiyuu no Tsubasa", type: "OP 2", duration: 95 },
      { name: "Utsukushiki Zankoku na Sekai", type: "ED 1", duration: 102 },
      { name: "Akatsuki no Requiem", type: "OP 4", duration: 111 },
    ] },
  { id: "kny", title: "Demon Slayer", glyph: "鬼", hue: 340, year: "2019", poster: "",
    songs: [
      { name: "Gurenge", type: "OP 1", duration: 92 },
      { name: "Kamado Tanjirou no Uta", type: "Insert", duration: 78 },
      { name: "Akeboshi", type: "ED 2", duration: 96 },
    ] },
  { id: "naruto", title: "Naruto", glyph: "忍", hue: 28, year: "2002", poster: "",
    songs: [
      { name: "Haruka Kanata", type: "OP 3", duration: 100 },
      { name: "Sadness and Sorrow", type: "OST", duration: 145 },
      { name: "Kanashimi wo Yasashisa ni", type: "ED 4", duration: 88 },
      { name: "Blue Bird", type: "OP 6 (Shippuden)", duration: 94 },
    ] },
  { id: "onepiece", title: "One Piece", glyph: "海", hue: 200, year: "1999", poster: "",
    songs: [
      { name: "We Are!", type: "OP 1", duration: 83 },
      { name: "Believe", type: "OP 2", duration: 90 },
      { name: "Memories", type: "ED 3", duration: 105 },
    ] },
  { id: "jjk", title: "Jujutsu Kaisen", glyph: "呪", hue: 265, year: "2020", poster: "",
    songs: [
      { name: "Kaikai Kitan", type: "OP 1", duration: 91 },
      { name: "Give It Back", type: "OP 2", duration: 87 },
      { name: "Vivid Vice", type: "OP 3", duration: 93 },
    ] },
  { id: "mha", title: "My Hero Academia", glyph: "力", hue: 5, year: "2016", poster: "",
    songs: [
      { name: "The Day", type: "OP 1", duration: 89 },
      { name: "Peace Sign", type: "OP 2", duration: 96 },
      { name: "Kaikaikitan (MHA ver.)", type: "ED 5", duration: 84 },
    ] },
  { id: "deathnote", title: "Death Note", glyph: "死", hue: 0, year: "2006", poster: "",
    songs: [{ name: "The World", type: "OP 1", duration: 87 }] },
  { id: "fma", title: "Fullmetal Alchemist", glyph: "錬", hue: 40, year: "2009", poster: "",
    songs: [
      { name: "Again", type: "OP 1", duration: 92 },
      { name: "Hologram", type: "OP 2", duration: 88 },
      { name: "Rain", type: "ED 1", duration: 99 },
    ] },
  { id: "bebop", title: "Cowboy Bebop", glyph: "宇", hue: 45, year: "1998", poster: "",
    songs: [{ name: "Tank!", type: "OP 1", duration: 119 }] },
];

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function SakuraPetals() {
  const petals = Array.from({ length: 14 });
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {petals.map((_, i) => {
        const left = (i * 7.3) % 100;
        const delay = (i * 1.7) % 12;
        const duration = 14 + (i % 5) * 3;
        const size = 10 + (i % 4) * 4;
        const drift = (i % 2 === 0 ? 1 : -1) * (20 + (i % 3) * 10);
        return (
          <div key={i} style={{ position: "absolute", top: -30, left: `${left}%`, width: size, height: size, animation: `fall ${duration}s linear ${delay}s infinite`, "--drift": `${drift}px` }}>
            <svg viewBox="0 0 24 24" width={size} height={size} style={{ opacity: 0.35 }}>
              <path d="M12 2c2 2 2 4 0 6-2-2-2-4 0-6z M12 22c-2-2-2-4 0-6 2 2 2 4 0 6z M2 12c2-2 4-2 6 0-2 2-4 2-6 0z M22 12c-2 2-4 2-6 0 2-2 4-2 6 0z M5 5c2.5 1 3.5 3 3 5.5-2.5-.3-4-2-4.5-4.5.3-.4.9-.8 1.5-1z" fill="#f2b6c6" />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

function TreeCorners() {
  const base = { position: "fixed", width: 260, height: "auto", zIndex: 0, pointerEvents: "none", opacity: 0.9, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))" };
  return (
    <>
      <img src={treeBranch} alt="" style={{ ...base, top: -18, insetInlineStart: -20, transform: "scaleX(-1) rotate(6deg)" }} />
      <img src={treeBranch} alt="" style={{ ...base, bottom: -18, insetInlineEnd: -20, transform: "rotate(186deg)" }} />
    </>
  );
}

function ToriiMark({ size = 64, color = "#e8623c" }) {
  return (
    <svg viewBox="0 0 100 80" width={size} height={size * 0.8} style={{ opacity: 0.55 }}>
      <rect x="8" y="18" width="84" height="7" rx="1.5" fill={color} />
      <rect x="2" y="30" width="96" height="6" rx="1.5" fill={color} />
      <rect x="18" y="36" width="8" height="40" fill={color} />
      <rect x="74" y="36" width="8" height="40" fill={color} />
      <rect x="40" y="30" width="6" height="20" fill={color} opacity="0.7" />
    </svg>
  );
}

function WaveStrip({ hue = 14 }) {
  const arcs = Array.from({ length: 10 });
  return (
    <svg width="100%" height="14" viewBox="0 0 200 14" preserveAspectRatio="none" style={{ display: "block" }}>
      {arcs.map((_, i) => (
        <path key={i} d={`M${i * 22 - 5} 14 A 11 11 0 0 1 ${i * 22 + 17} 14`} fill="none" stroke={`hsla(${hue}, 55%, 60%, 0.35)`} strokeWidth="1.4" />
      ))}
    </svg>
  );
}

function StarRating({ rating, onRate }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onRate(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }} aria-label={`Rate ${n} stars`}>
          <Star size={16} fill={(hover || rating) >= n ? "#f2b84e" : "none"} color={(hover || rating) >= n ? "#f2b84e" : "#6b6b76"} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

// --- Auth -------------------------------------------------------------
const AuthContext = createContext(null);
function useAuth() {
  return useContext(AuthContext);
}

const inputStyle = {
  background: "#111116", border: "1px solid #2a2a32", borderRadius: 7, padding: "9px 12px",
  color: "#eae6df", fontSize: 13, fontFamily: "'Noto Sans', sans-serif", outline: "none", width: "100%",
};
const linkBtnStyle = { background: "none", border: "none", color: "#e8623c", cursor: "pointer", fontSize: 12.5, textDecoration: "underline", padding: 0, fontFamily: "'Noto Sans', sans-serif" };

function AuthModal({ onClose }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (mode === "login") {
      if (!identifier.trim() || !password) return setError("Please fill in both fields.");
      setBusy(true);
      try {
        await signIn(identifier, password);
        onClose();
      } catch (e) {
        setError(e.message);
      }
      setBusy(false);
      return;
    }
    if (!username.trim() || !email.trim() || !password || !confirmPassword) return setError("Please fill in all fields.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please enter a valid email address.");
    if (password !== confirmPassword) return setError("Passwords don't match.");
    setBusy(true);
    try {
      await signUp(username, email, password);
      await signIn(username, password);
      onClose();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(6,6,8,0.72)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, background: "#17171d", border: "1px solid #2a2a32", borderRadius: 12, padding: "26px 24px 24px", position: "relative", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 14, insetInlineEnd: 14, background: "none", border: "none", color: "#8d8d97", cursor: "pointer" }}>
          <X size={18} />
        </button>

        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><ToriiMark size={36} /></div>
          <h2 style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 22, color: "#f2efe9", margin: 0 }}>
            {mode === "login" ? "Welcome Back" : "Join the Archive"}
          </h2>
          <p style={{ color: "#8d8d97", fontSize: 12.5, marginTop: 6 }}>
            {mode === "login" ? "Sign in to rate and comment." : "Create an account to leave comments."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {mode === "login" ? (
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Username or Gmail" style={inputStyle} />
          ) : (
            <>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" style={inputStyle} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Gmail / email address" style={inputStyle} />
            </>
          )}
          <input value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => mode === "login" && e.key === "Enter" && submit()} type="password" placeholder="Password" style={inputStyle} />
          {mode === "signup" && (
            <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} type="password" placeholder="Confirm password" style={inputStyle} />
          )}
        </div>

        {error && <div style={{ color: "#e8746b", fontSize: 12, marginTop: 10 }}>{error}</div>}

        <button onClick={submit} disabled={busy} style={{ width: "100%", marginTop: 14, background: "#e8623c", border: "none", borderRadius: 8, padding: "10px 0", color: "#fff", fontFamily: "'Noto Sans', sans-serif", fontWeight: 600, fontSize: 13.5, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>
          {busy ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: "#8d8d97" }}>
          {mode === "login" ? (
            <>New here? <button onClick={() => { setMode("signup"); setError(""); }} style={linkBtnStyle}>Create an account</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setMode("login"); setError(""); }} style={linkBtnStyle}>Log in</button></>
          )}
        </div>
      </div>
    </div>
  );
}

function UserBar() {
  const { currentUser, signOut, openAuthModal } = useAuth();
  if (!currentUser) {
    return (
      <button onClick={openAuthModal} style={{ background: "#1e1e25", border: "1px solid #2a2a32", borderRadius: 20, padding: "6px 16px", color: "#eae6df", fontFamily: "'Noto Sans', sans-serif", fontSize: 12.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
        <LogIn size={14} /> Sign In / Sign Up
      </button>
    );
  }
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#1e1e25", border: "1px solid #2a2a32", borderRadius: 20, padding: "6px 8px 6px 14px", fontFamily: "'Noto Sans', sans-serif", fontSize: 12.5, color: "#eae6df" }}>
      <User size={14} />
      {currentUser.username}
      <button onClick={signOut} aria-label="Log out" style={{ background: "#2a2a32", border: "none", borderRadius: 14, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "#c9c9d1", cursor: "pointer" }}>
        <LogOut size={12} />
      </button>
    </div>
  );
}
// ------------------------------------------------------------------------

function AnimeCard({ anime }) {
  const { currentUser, openAuthModal } = useAuth();
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [rating, setRating] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const [topComment, setTopComment] = useState(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const intervalRef = useRef(null);

  const song = anime.songs[activeIdx];
  const multi = anime.songs.length > 1;
  const hue = anime.hue;

  const loadComments = async () => {
    setCommentsLoading(true);
    setCommentsError("");
    try {
      const [list, top] = await Promise.all([fetchComments(anime.id), fetchTopComment(anime.id)]);
      setComments(list);
      setTopComment(top);
    } catch (e) {
      setCommentsError("Couldn't load comments - is the backend running?");
    }
    setCommentsLoading(false);
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anime.id]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setTime((t) => {
          if (t >= song.duration) {
            setIsPlaying(false);
            return 0;
          }
          return t + 0.25;
        });
      }, 250);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, song.duration]);

  const selectSong = (idx) => {
    if (idx === activeIdx) return;
    setActiveIdx(idx);
    setTime(0);
    setIsPlaying(false);
  };

  const pct = Math.min(100, (time / song.duration) * 100);

  const addComment = async () => {
    if (!currentUser) return openAuthModal();
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    try {
      await postComment(anime.id, text, currentUser.accessToken);
      setDraft("");
      await loadComments();
    } catch (e) {
      setCommentsError(e.message);
    }
    setPosting(false);
  };

  const handleLike = async (commentId) => {
    if (!currentUser) return openAuthModal();
    try {
      await likeComment(anime.id, commentId, currentUser.accessToken);
      await loadComments();
    } catch (e) {
      setCommentsError(e.message);
    }
  };

  return (
    <div style={{ position: "relative", zIndex: 1, background: "#17171d", border: `1px solid hsla(${hue}, 60%, 55%, 0.25)`, borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}>
      {/* Poster / label area */}
      <div style={{ position: "relative", height: 200, background: anime.poster ? "#000" : `linear-gradient(160deg, hsl(${hue}, 55%, 16%) 0%, hsl(${hue}, 70%, 9%) 60%, #101014 100%)`, borderBottom: `2px solid hsla(${hue}, 70%, 55%, 0.5)`, overflow: "hidden" }}>
        {anime.poster && <img src={anime.poster} alt={anime.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05) 40%, rgba(8,8,10,0.92) 100%)" }} />
        <div style={{ position: "absolute", top: 12, insetInlineEnd: 12, width: 34, height: 34, background: "#a83232", border: "1.5px solid #e8b0a8", borderRadius: 4, transform: "rotate(-6deg)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>
          <span style={{ color: "#f7e6dc", fontFamily: "'Shippori Mincho', serif", fontSize: 17, lineHeight: 1 }}>{anime.glyph}</span>
        </div>
        <div style={{ position: "absolute", top: 14, insetInlineStart: 16, fontSize: 11, letterSpacing: 1.5, color: `hsla(${hue}, 70%, 70%, 0.75)`, fontFamily: "'Noto Sans', sans-serif", textTransform: "uppercase" }}>
          Side A · {anime.year}
        </div>
        <div style={{ position: "absolute", bottom: 14, insetInlineStart: 16, insetInlineEnd: 16 }}>
          <h3 style={{ margin: 0, fontFamily: "'Shippori Mincho', serif", fontSize: 25, fontWeight: 700, color: "#f2efe9", letterSpacing: 0.5, textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>{anime.title}</h3>
        </div>
      </div>

      {multi && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 12px 8px", borderBottom: "1px solid #232329" }}>
          {anime.songs.map((s, idx) => (
            <button key={s.name} onClick={() => selectSong(idx)} style={{ flex: "0 0 auto", background: idx === activeIdx ? `hsl(${hue}, 55%, 22%)` : "#1e1e25", border: idx === activeIdx ? `1px solid hsl(${hue}, 70%, 55%)` : "1px solid #2a2a32", borderRadius: 20, padding: "5px 12px", cursor: "pointer", color: idx === activeIdx ? "#fff" : "#a9a9b3", fontSize: 11.5, fontFamily: "'Noto Sans', sans-serif", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}>
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: `hsla(${hue}, 60%, 60%, 0.25)`, color: `hsl(${hue}, 70%, 78%)` }}>{s.type}</span>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Cassette player */}
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ fontSize: 12, color: "#8d8d97", fontFamily: "'Noto Sans', sans-serif", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <span>♪ {isPlaying ? "Now playing" : "Ready"}: {song.name}</span>
          <span style={{ color: `hsl(${hue}, 60%, 65%)` }}>{song.type}</span>
        </div>
        <div style={{ background: "#111116", borderRadius: 8, border: "1px solid #26262e", padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setIsPlaying((p) => !p)} style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid hsl(${hue}, 60%, 50%)`, background: `hsl(${hue}, 45%, 16%)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "0 0 auto" }} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginInlineStart: 1 }} />}
          </button>
          <Disc3 size={20} color={`hsl(${hue}, 55%, 55%)`} style={{ animation: isPlaying ? "spin 1.4s linear infinite" : "none", flex: "0 0 auto", opacity: 0.85 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 2, background: "#2a2a32", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", insetInlineStart: 0, top: 0, bottom: 0, width: `${pct}%`, background: `hsl(${hue}, 65%, 55%)`, transition: "width 0.2s linear" }} />
            </div>
          </div>
          <Disc3 size={20} color={`hsl(${hue}, 55%, 55%)`} style={{ animation: isPlaying ? "spin 1.4s linear infinite" : "none", flex: "0 0 auto", opacity: 0.85 }} />
          <span style={{ fontSize: 11, color: "#8d8d97", fontFamily: "'Noto Sans', sans-serif", flex: "0 0 auto", minWidth: 62, textAlign: "end" }}>{formatTime(time)} / {formatTime(song.duration)}</span>
        </div>
      </div>

      {/* Rating + comments row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px 14px", borderTop: "1px solid #202027", marginTop: 4 }}>
        <StarRating rating={rating} onRate={setRating} />
        <button onClick={() => setShowComments((s) => !s)} style={{ background: "none", border: "none", color: showComments ? `hsl(${hue}, 65%, 65%)` : "#8d8d97", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontFamily: "'Noto Sans', sans-serif", padding: "4px 6px" }}>
          <MessageCircle size={16} />
          {comments.length > 0 ? comments.length : ""} Comments
        </button>
      </div>

      {showComments && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #202027" }}>
          {topComment && (
            <div style={{ marginTop: 10, background: `hsla(${hue}, 55%, 25%, 0.25)`, border: `1px solid hsl(${hue}, 55%, 40%)`, borderRadius: 6, padding: "6px 10px", fontSize: 12.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#f2c14e", fontSize: 10.5, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>
                <Crown size={11} /> Top comment · {topComment.likes} likes
              </div>
              <span style={{ color: `hsl(${hue}, 60%, 75%)`, fontWeight: 600 }}>{topComment.username}: </span>
              <span style={{ color: "#d4d4d9" }}>{topComment.text}</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10, maxHeight: 140, overflowY: "auto" }}>
            {commentsLoading && <div style={{ fontSize: 12, color: "#5f5f68", fontFamily: "'Noto Sans', sans-serif" }}>Loading comments...</div>}
            {commentsError && <div style={{ fontSize: 12, color: "#e8746b", fontFamily: "'Noto Sans', sans-serif" }}>{commentsError}</div>}
            {!commentsLoading && !commentsError && comments.length === 0 && (
              <div style={{ fontSize: 12, color: "#5f5f68", fontFamily: "'Noto Sans', sans-serif" }}>No comments yet. Be the first!</div>
            )}
            {comments.map((c) => (
              <div key={c.id} style={{ background: "#1e1e25", borderRadius: 6, padding: "6px 10px", fontSize: 12.5, color: "#d4d4d9", fontFamily: "'Noto Sans', sans-serif", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div><span style={{ color: `hsl(${hue}, 60%, 70%)`, fontWeight: 600 }}>{c.username}: </span>{c.text}</div>
                <button onClick={() => handleLike(c.id)} style={{ background: "none", border: "none", color: "#8d8d97", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, flex: "0 0 auto", fontSize: 11.5 }}>
                  <Heart size={12} /> {c.likes}
                </button>
              </div>
            ))}
          </div>

          {currentUser ? (
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()} placeholder="Write a comment..." style={{ flex: 1, background: "#111116", border: "1px solid #2a2a32", borderRadius: 6, padding: "7px 10px", color: "#eae6df", fontSize: 12.5, fontFamily: "'Noto Sans', sans-serif", outline: "none" }} />
              <button onClick={addComment} disabled={posting} style={{ background: `hsl(${hue}, 45%, 22%)`, border: `1px solid hsl(${hue}, 60%, 45%)`, borderRadius: 6, padding: "0 10px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }} aria-label="Send comment">
                <Send size={13} />
              </button>
            </div>
          ) : (
            <button onClick={openAuthModal} style={{ width: "100%", marginTop: 8, background: "#1e1e25", border: `1px dashed hsl(${hue}, 50%, 40%)`, borderRadius: 6, padding: "8px 0", color: "#a9a9b3", fontSize: 12.5, fontFamily: "'Noto Sans', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <LogIn size={13} /> Sign in to comment
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (session) setCurrentUser({ ...session.user, accessToken: session.accessToken });
  }, []);

  const signIn = async (identifier, password) => {
    const session = await login(identifier, password);
    setCurrentUser({ ...session.user, accessToken: session.accessToken });
  };

  const signUp = async (username, email, password) => {
    await register(username, email, password);
  };

  const signOut = () => {
    logout();
    setCurrentUser(null);
  };

  const auth = { currentUser, signIn, signUp, signOut, openAuthModal: () => setAuthModalOpen(true) };

  return (
    <AuthContext.Provider value={auth}>
      <div style={{ position: "relative", minHeight: "100vh", background: "radial-gradient(ellipse at 50% -10%, #1a1a22 0%, #0b0b0e 55%)", padding: "36px 20px 0", fontFamily: "'Noto Sans', sans-serif", overflow: "hidden" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700;800&family=Noto+Sans:wght@400;500;600&display=swap');
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes fall {
            0% { transform: translateY(-5vh) translateX(0) rotate(0deg); }
            100% { transform: translateY(105vh) translateX(var(--drift)) rotate(300deg); }
          }
          input::placeholder { color: #5f5f68; }
          * { box-sizing: border-box; }
        `}</style>

        <SakuraPetals />
        <TreeCorners />

        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "flex-end", maxWidth: 1080, margin: "0 auto 10px" }}>
          <UserBar />
        </div>

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}><ToriiMark size={54} /></div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#e8623c", fontFamily: "'Noto Sans', sans-serif", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
            <Disc3 size={14} /> Anime Mixtape Archive
          </div>
          <h1 style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 700, fontSize: 40, color: "#f2efe9", margin: "0 0 8px", letterSpacing: 1 }}>Anime Mixtape</h1>
          <p style={{ color: "#8d8d97", fontSize: 14, maxWidth: 480, margin: "0 auto", fontFamily: "'Noto Sans', sans-serif" }}>
            An archive of legendary anime alongside their openings, endings, and soundtracks — pick a track and press play
          </p>
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, maxWidth: 1080, margin: "0 auto", paddingBottom: 40 }}>
          {ANIMES.map((a) => <AnimeCard key={a.id} anime={a} />)}
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto" }}>
          <WaveStrip hue={14} />
          <div style={{ height: 20 }} />
        </div>

        {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
      </div>
    </AuthContext.Provider>
  );
}
