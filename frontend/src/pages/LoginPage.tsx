/**
 * Login Page — StartupSetu.
 *
 * Minimal, production-ready enterprise government login.
 * Focused sign-in experience without marketing/workflow presentations.
 * Strictly preserves authentication logic, validation, demo accounts, and redirect behavior.
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import type { UserRole } from "@/types";
import {
  Layers,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Shield,
  Mail,
  Lock,
  UserCheck,
} from "lucide-react";

interface DemoUser {
  label: string;
  email: string;
  role: UserRole;
  department?: string;
}

const demoAccounts: DemoUser[] = [
  { label: "Government Officer", email: "gov@demo.sih", role: "GOVERNMENT_OFFICER", department: "Ministry of Urban Development" },
  { label: "Startup Founder", email: "startup@demo.sih", role: "STARTUP", department: "TechVista Solutions" },
  { label: "Technical Evaluator", email: "evaluator@demo.sih", role: "EVALUATOR", department: "Evaluation Committee" },
  { label: "Platform Admin", email: "admin@demo.sih", role: "ADMIN", department: "Platform Administrator" },
  { label: "Public Auditor", email: "auditor@demo.sih", role: "AUDITOR", department: "Auditor Oversight" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("gov@demo.sih");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate("/gov/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoAccount = (demo: DemoUser) => {
    setEmail(demo.email);
    setPassword("demo1234");
    setError(null);
    setDemoModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left / Brand Area */}
        <div className="lg:w-[45%] xl:w-[42%] bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-8 sm:p-12 lg:p-16 text-white relative">
          <div className="relative z-10">
            {/* Logo Mark & Name */}
            <div className="flex items-center gap-3.5 mb-8">
              <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center shadow-md">
                <Layers className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight leading-tight block">
                  StartupSetu
                </span>
                <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
                  Government Innovation Procurement Platform
                </span>
              </div>
            </div>

            {/* Concise Mission Statement */}
            <div className="mt-12 lg:mt-24 max-w-md">
              <div className="w-10 h-0.5 bg-blue-500 mb-6 rounded-full" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                Accelerating public innovation with verified startups.
              </h2>
              <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                A digital platform for discovering, evaluating and scaling innovative startup solutions.
              </p>
            </div>
          </div>

          {/* System Security Notice */}
          <div className="relative z-10 mt-12 pt-8 border-t border-slate-800/80">
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Authorized personnel only. Secure digital access.</span>
            </div>
          </div>
        </div>

        {/* Right / Sign In Area */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white">
          <div className="w-full max-w-[400px]">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Sign in to StartupSetu
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Use your authorized account to access the platform.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-red-900 block">Authentication Failed</span>
                  <span className="text-xs text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="officer@gov.in"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 text-sm rounded-lg transition-all duration-150 mt-2 shadow-sm flex items-center justify-center gap-2"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {/* Quick Demo Credentials Switcher */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDemoModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Quick Fill: Select Evaluation Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Accounts Modal */}
      <Modal
        open={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="Select Evaluation Account"
      >
        <div className="space-y-2 py-1">
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Select a pre-configured role to populate credentials for evaluation.
          </p>
          {demoAccounts.map((demo) => (
            <button
              key={demo.role}
              type="button"
              onClick={() => handleSelectDemoAccount(demo)}
              className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="font-semibold text-xs text-slate-900 group-hover:text-blue-700 block">
                  {demo.label}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {demo.department}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                {demo.email}
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        open={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Password Recovery"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-600 leading-relaxed">
            For security reasons on the government platform, password resets require domain administrator confirmation. Please contact your departmental IT officer or administrator.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 font-mono">
            Support: admin@procurement.gov.in
          </div>
          <div className="flex justify-end pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setForgotModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
