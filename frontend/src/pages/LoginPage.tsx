/**
 * Login Page — Startup Procurement.
 *
 * Modern, solid-color split layout matching the light-mode enterprise shell.
 * Strict Rule: Solid colors only — NO gradients!
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
  ShieldCheck,
  Mail,
  Lock,
  Target,
  Search,
  FlaskConical,
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6 lg:p-10">
      {/* Container Card */}
      <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
        {/* Left Side: Solid Dark Brand Panel (NO GRADIENTS) */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Product Brand Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center border border-blue-800 shadow-2xs shrink-0">
                <Layers className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
                  Startup Procurement
                </h1>
                <span className="text-[11px] text-slate-400 font-medium">
                  Workspace Portal
                </span>
              </div>
            </div>

            {/* Platform Feature List */}
            <div className="space-y-3 mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Core Procurement Capabilities
              </h2>

              <div className="p-3.5 rounded-lg bg-slate-800/90 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                  <Target className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Challenge Management</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                  Define public sector requirement statements and set target metrics.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-800/90 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                  <Search className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Startup Discovery</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                  Identify capable startups and screen technical proposal submissions.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-800/90 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                  <FlaskConical className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Pilot Telemetry</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                  Track live pilot performance compliance and milestone verification.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authorized access workspace for public procurement</span>
          </div>
        </div>

        {/* Right Side: Modern Authentication Panel */}
        <div className="lg:col-span-7 bg-slate-50/70 p-8 lg:p-12 flex flex-col justify-between">
          <div className="max-w-md w-full mx-auto">
            
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Sign in to workspace
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your account credentials to access your dashboard.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Authentication Failed</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-medium shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-medium shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-blue-700 font-semibold hover:underline">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 text-xs rounded-lg shadow-2xs mt-2"
              >
                Sign In to Platform <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>

          {/* Discreet Demo Access Link */}
          <div className="mt-8 pt-4 border-t border-slate-200/80 text-center">
            <button
              type="button"
              onClick={() => setDemoModalOpen(true)}
              className="text-[11px] text-slate-400 hover:text-slate-700 font-medium transition-colors underline underline-offset-2"
            >
              Demo access
            </button>
          </div>
        </div>
      </div>

      {/* Discreet Demo Access Modal */}
      <Modal
        open={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="Select Demo Account Role"
      >
        <div className="space-y-2 py-1">
          <p className="text-xs text-slate-500 mb-3">
            Select a pre-configured role account to populate the sign-in form for evaluation.
          </p>
          {demoAccounts.map((demo) => (
            <button
              key={demo.role}
              type="button"
              onClick={() => handleSelectDemoAccount(demo)}
              className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-900">
                    {demo.label}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 pl-6 block mt-0.5">
                  {demo.department}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {demo.email}
              </span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
