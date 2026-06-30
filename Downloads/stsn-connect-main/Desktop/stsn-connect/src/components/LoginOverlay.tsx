/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useSTSNStore } from "../services/store";
import {
  BookOpen,
  ShieldAlert,
  CheckCircle,
  Key,
  Mail,
  Sparkles,
  Building2,
  Landmark,
} from "lucide-react";

export default function LoginOverlay() {
  const { login, currentUser, users } = useSTSNStore();
  const [email, setEmail] = useState("admin@stsn.edu.ph");
  const [password, setPassword] = useState("password123");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Registration states
  const [regFirst, setRegFirst] = useState("");
  const [regLast, setRegLast] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState<"STUDENT" | "TEACHER">("STUDENT");

  if (currentUser) return null; // Already logged in

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== "password123") {
      setErrorMsg("Error: Invalid credentials. Enter 'password123'");
      return;
    }
    const success = login(email, "");
    if (!success) {
      setErrorMsg("Error: Account inactive or email not registered.");
    } else {
      setErrorMsg("");
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword("password123");
    login(quickEmail, "");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-stsn-cream text-stsn-text font-sans animate-fade-in antialiased">
      {/* LEFT PANEL: AUTH FORM */}
      <div className="w-full md:w-[450px] lg:w-[500px] flex-shrink-0 flex flex-col justify-between p-8 md:p-12 bg-white border-r border-stsn-beige h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stsn-brown flex items-center justify-center text-stsn-cream shadow-md">
            <Building2 className="w-5 h-5 text-stsn-gold-light" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-stsn-brown-dark leading-none">
              STSN <span className="text-stsn-gold">Connect</span>
            </h1>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-mono mt-1">
              St. Theresa School
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="my-auto py-8">
          <div>
            <h2 className="text-2xl font-display font-semibold text-stone-900 tracking-tight">
              {activeTab === "login"
                ? "Login to your account"
                : "Create Student Account"}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {activeTab === "login"
                ? "Academic information & administrative enterprise system."
                : "Register a pre-evaluation record for SY 2026-2027."}
            </p>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-xs text-red-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === "login" ? (
            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-9 pr-4 text-sm font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-stsn-brown focus:border-stsn-brown transition-all"
                    placeholder="Enter academic email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-9 pr-4 text-sm font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-stsn-brown focus:border-stsn-brown transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-stsn-brown hover:bg-stsn-brown-dark transition-all duration-300 text-stsn-cream text-sm font-medium py-2.5 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                Let's Connect
              </button>
            </form>
          ) : (
            <div className="mt-6 space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regFirst}
                    onChange={(e) => setRegFirst(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm font-medium focus:outline-none"
                    placeholder="Enrico"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regLast}
                    onChange={(e) => setRegLast(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm font-medium focus:outline-none"
                    placeholder="Veloso"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Personal Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm font-medium focus:outline-none"
                  placeholder="enrico@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Desired Registration Role
                </label>
                <select
                  value={regRole}
                  onChange={(e: any) => setRegRole(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-sm font-medium focus:outline-none"
                >
                  <option value="STUDENT">
                    Student Candidate (Pre-enrollee)
                  </option>
                  <option value="TEACHER">Faculty Candidate</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setErrorMsg("");
                  // Mock register success and route to student
                  handleQuickLogin("student@stsn.edu.ph");
                }}
                className="w-full bg-stsn-gold hover:bg-[#A37B3E] text-white text-sm font-medium py-2.5 rounded-lg shadow-sm cursor-pointer hover:shadow transition-all"
              >
                Register & Initialize Account
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 text-xs text-stone-500">
            {activeTab === "login" ? (
              <>
                <span>Don't have an account?</span>
                <button
                  onClick={() => setActiveTab("register")}
                  className="text-stsn-brown font-semibold hover:underline"
                >
                  Create Account
                </button>
              </>
            ) : (
              <>
                <span>Already have an account?</span>
                <button
                  onClick={() => setActiveTab("login")}
                  className="text-stsn-brown font-semibold hover:underline"
                >
                  Login instead
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Presenter Accounts Box */}
        <div className="p-4 bg-stsn-cream border border-stsn-beige rounded-xl">
          <p className="text-xs text-stsn-brown font-semibold flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-stsn-gold" />
            Quick Live Presentation Accounts
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {users.map((u) => (
              <button
                key={u.role}
                onClick={() => handleQuickLogin(u.email)}
                className="bg-white hover:bg-stsn-beige text-[11px] text-stone-700 hover:text-stsn-brown border border-stone-200/80 rounded px-2 py-1 text-left font-medium transition-all flex items-center gap-1 truncate"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-stsn-gold" />
                <span className="truncate">{u.role.replace("_", " ")}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: CAMPUS PANORAMA ILLUSTRATION */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-stsn-brown-dark via-stsn-brown to-stone-900 border-l border-stsn-brown p-12 text-stsn-cream flex-col justify-between relative overflow-hidden">
        {/* Simulated Courtyard Pattern Background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(var(--color-stsn-cream)_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
          {/* Symmetrical Arch Layout */}
          <div className="absolute bottom-0 inset-x-0 h-96 border-t-4 border-stsn-gold rounded-t-[50%] flex justify-around p-8">
            <div className="w-16 h-full border-r-2 border-stsn-gold opacity-30" />
            <div className="w-16 h-full border-r-2 border-stsn-gold opacity-30" />
            <div className="w-16 h-full border-r-2 border-stsn-gold opacity-30" />
          </div>
        </div>

        {/* Fine Academic Motto Top */}
        <div className="flex justify-between items-center z-10">
          <div className="text-[11px] font-mono tracking-widest text-stsn-gold-light/75 uppercase uppercase font-semibold flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5" />
            Established 1990 • Novaliches, Quezon City
          </div>
          <span className="bg-stsn-cream/10 border border-stsn-cream/20 rounded-full px-3 py-1 text-[10px] font-semibold text-stsn-gold-light tracking-wide">
            Enterprise Client Presentation SY 2026-2027
          </span>
        </div>

        {/* Elegant Centered Title */}
        <div className="max-w-xl z-10 my-auto">
          <div className="inline-block bg-stsn-gold/20 border border-stsn-gold/40 text-stsn-gold-light text-xs font-mono px-3 py-1 rounded-full mb-4">
            Unified School Management System
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold leading-none tracking-tight">
            Welcome to{" "}
            <span className="text-stsn-gold-light">Theresian Connect</span>
          </h2>
          <p className="text-stone-300 text-sm mt-4 font-normal leading-relaxed">
            A state-of-the-art educational resource platform seamlessly
            consolidating enrollment checklists, assessment billing, hybrid
            grade distribution, and HR payroll services under one intuitive
            enterprise dashboard.
          </p>

          <div className="grid grid-cols-3 gap-6 mt-8 p-5 bg-black/25 backdrop-blur-md rounded-2xl border border-white/5">
            <div>
              <div className="text-2xl font-bold text-stsn-gold-light font-display">
                100%
              </div>
              <div className="text-[10px] uppercase text-stone-400 mt-0.5 tracking-wider font-mono">
                Philippine K-12 Compliant
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-stsn-gold-light font-display">
                Zero-DB
              </div>
              <div className="text-[10px] uppercase text-stone-400 mt-0.5 tracking-wider font-mono">
                Dynamic Mock-TS State
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-stsn-gold-light font-display">
                Multi-Role
              </div>
              <div className="text-[10px] uppercase text-stone-400 mt-0.5 tracking-wider font-mono">
                Enterprise Grade ERP
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Tech Stack Indicators */}
        <div className="text-xs text-stone-400/90 flex justify-between z-10 border-t border-white/5 pt-4">
          <p>© St. Theresa School (STSN Connect) • All rights reserved.</p>
          <div className="flex gap-3 text-[10px] font-mono">
            <span>REACT 19</span>
            <span>TAILWIND v4</span>
            <span>ZUSTAND</span>
          </div>
        </div>
      </div>
    </div>
  );
}
