import React, { useState } from "react";
import { User, Lock, Mail, Building, Phone, KeyRound, UserPlus, LogIn, Sparkles, X, ArrowLeft } from "lucide-react";
import { apiService } from "../../services/api";

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [forgotStep, setForgotStep] = useState(1); // 1: Send OTP, 2: Reset Password

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [phone, setPhone] = useState("");

  // Forgot password fields
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!email.trim()) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.requestResetOtp(email.trim());
      setSuccessMsg(`✅ Verification OTP sent to ${email.trim()}! (Demo OTP Code: ${res.otpDemo})`);
      setForgotStep(2);
    } catch (err) {
      setErrorMsg(err.message || "Failed to send reset OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!otpCode.trim() || !newPassword.trim()) {
      setErrorMsg("Please enter the OTP code and your new password.");
      return;
    }

    setLoading(true);
    try {
      await apiService.resetPassword(email.trim(), otpCode.trim(), newPassword.trim());
      setSuccessMsg("🎉 Password updated successfully! Redirecting to Sign In...");
      setTimeout(() => {
        setMode("login");
        setPassword("");
        setOtpCode("");
        setNewPassword("");
        resetMessages();
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (mode === "forgot") {
      if (forgotStep === 1) {
        handleRequestOtp(e);
      } else {
        handleResetPassword(e);
      }
      return;
    }

    setLoading(true);

    try {
      if (mode === "register") {
        if (!name.trim() || !department.trim() || !email.trim() || !password.trim()) {
          setErrorMsg("Please fill in all required fields.");
          setLoading(false);
          return;
        }

        const res = await onLoginSuccess("register", {
          name: name.trim(),
          department: department.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim()
        });

        if (res?.error) {
          setErrorMsg(res.error);
        } else {
          onClose();
        }
      } else {
        // Login
        if (!email.trim() || !password.trim()) {
          setErrorMsg("Please provide email and password.");
          setLoading(false);
          return;
        }

        const res = await onLoginSuccess("login", { email: email.trim(), password: password.trim() });
        if (res?.error) {
          setErrorMsg(res.error);
        } else {
          onClose();
        }
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/50 max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-xl transition"
        >
          <X size={18} />
        </button>

        {/* Modal Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/30">
            {mode === "register" ? (
              <UserPlus className="text-slate-950" size={24} />
            ) : mode === "forgot" ? (
              <KeyRound className="text-slate-950" size={24} />
            ) : (
              <LogIn className="text-slate-950" size={24} />
            )}
          </div>
          <h3 className="text-2xl font-black text-white">
            {mode === "register" ? "Faculty Sign Up" : mode === "forgot" ? "Reset Password" : "Account Authentication"}
          </h3>
          <p className="text-xs text-slate-400">
            {mode === "register"
              ? "Create a fresh faculty account to book campus halls"
              : mode === "forgot"
              ? forgotStep === 1
                ? "Enter your registered email to receive a 6-digit OTP verification code"
                : "Enter the OTP code received and set your new password"
              : "Log in with your credentials to access room booking & admin portal"}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-500/60 p-3 rounded-2xl text-rose-300 text-xs font-semibold text-center">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-950/90 border border-emerald-500/80 p-3 rounded-2xl text-emerald-300 text-xs font-semibold text-center leading-relaxed">
            {successMsg}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Robert Oppenheimer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Department *</label>
                <div className="relative">
                  <Building size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science & Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="+1 (555) 019-2831"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Input (All modes) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                disabled={mode === "forgot" && forgotStep === 2}
                placeholder={mode === "register" ? "faculty@mits.ac.in" : "admin@gmail.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {/* Login or Register Password */}
          {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password *</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setForgotStep(1);
                      resetMessages();
                    }}
                    className="text-[11px] text-cyan-400 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Forgot Password Step 2: OTP Code & New Password */}
          {mode === "forgot" && forgotStep === 2 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">6-Digit Verification OTP Code *</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono text-cyan-300 tracking-widest focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Action Submit Buttons */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : mode === "register"
              ? "Complete Registration & Sign In →"
              : mode === "forgot"
              ? forgotStep === 1
                ? "Send OTP Verification Code →"
                : "Reset Password & Update Account →"
              : "Sign In to Account →"}
          </button>
        </form>

        {/* Footer Navigation Links */}
        <div className="text-center pt-2 border-t border-slate-800 space-y-1">
          {mode === "forgot" ? (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                resetMessages();
              }}
              className="text-xs text-cyan-400 hover:underline font-semibold flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                resetMessages();
              }}
              className="text-xs text-cyan-400 hover:underline font-semibold"
            >
              {mode === "register" ? "Already registered? Sign in here" : "New Faculty Member? Create an account here"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
