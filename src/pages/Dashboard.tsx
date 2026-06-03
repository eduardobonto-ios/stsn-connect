/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useSTSNStore } from "../services/store";
import {
  Users,
  GraduationCap,
  CreditCard,
  FileText,
  Calendar,
  Layers,
  Bell,
  TrendingUp,
  Award,
  Sparkles,
  ArrowUpRight,
  TrendingDown
} from "lucide-react";

export default function Dashboard() {
  const {
    students,
    teachers,
    payments,
    enrollments,
    announcements,
    events
  } = useSTSNStore();

  // Metrics calculation
  const totalEnrolled = students.filter((s) => s.enrollmentStatus === "Enrolled").length;
  const totalActive = students.length;
  const totalFaculty = teachers.length;
  
  // Total collections
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingEnrollments = enrollments.filter((e) => e.status === "Pending").length;

  // Students by Department Breakdown
  const basicCount = students.filter((s) => s.department === "Basic Education").length;
  const collegeCount = students.filter((s) => s.department === "College").length;
  
  const basicPercentage = Math.round((basicCount / (students.length || 1)) * 100);
  const collegePercentage = Math.round((collegeCount / (students.length || 1)) * 100);

  // Dynamic visual charts using symmetrical, inline animated pure SVG structures.
  // This delivers robust cross-device compatibility and exquisite bespoke design.
  const chartDataSchoolYear = [
    { year: "2023-2024", count: 420, color: "bg-stone-300" },
    { year: "2024-2025", count: 512, color: "bg-stsn-gold-light" },
    { year: "2025-2026", count: 680, color: "bg-stsn-gold" },
    { year: "2026-2027", count: 840, color: "bg-stsn-brown" }
  ];
  const maxYearCount = 900;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-stsn-brown-dark to-stsn-brown text-stsn-cream p-6 rounded-2xl border border-stsn-brown/30 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-stsn-gold/20 border border-stsn-gold/30 text-stsn-gold-light text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold">
            Academic ERP Workspace
          </span>
          <h2 className="text-2xl font-display font-medium mt-2 text-white">St. Theresa School Portal</h2>
          <p className="text-stone-300 text-xs mt-1">
            Enterprise command panel reporting live admissions indices, financial clearance cycles, and student records.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl px-4 py-2 flex.2 min-w-[100px] text-center">
            <span className="text-[10px] text-stsn-gold-light uppercase block font-mono">Academic Year</span>
            <span className="text-sm font-semibold text-white">2026-2027</span>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl px-4 py-2 flex.2 min-w-[100px] text-center">
            <span className="text-[10px] text-stsn-gold-light uppercase block font-mono">Current Semester</span>
            <span className="text-sm font-semibold text-white">1st Sem</span>
          </div>
        </div>
      </div>

      {/* Numerical Metrics Symmetrical Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs text-stone-500 font-semibold font-sans">Total Enrolled</span>
            <div className="p-2 rounded-lg bg-stsn-beige/40 text-stsn-brown">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-display font-bold text-stone-900">{totalEnrolled}</span>
            <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5 mt-1 font-mono">
              <TrendingUp className="w-3.5 h-3.5" /> +15.4% YoY
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs text-stone-500 font-semibold font-sans">Active Records</span>
            <div className="p-2 rounded-lg bg-stsn-cream text-stsn-gold">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-display font-bold text-stone-900">{totalActive}</span>
            <span className="text-[10px] text-stone-400 block mt-1 font-mono hover:text-stone-600">
              Valid Registered Students
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs text-stone-500 font-semibold font-sans">Admin Faculty</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-display font-bold text-stone-900">{totalFaculty}</span>
            <span className="text-[10px] text-stone-400 block mt-1 font-mono">Active Licensed LPTs</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs text-stone-500 font-semibold font-sans">Collections Fee</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-display font-bold text-stone-900">₱{totalPayments.toLocaleString()}</span>
            <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5 mt-1 font-mono">
              <TrendingUp className="w-3.5 h-3.5" /> +8.5% Target
            </span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-5 rounded-xl border border-stsn-beige shadow-sm col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs text-stone-500 font-semibold font-sans">Pending Reg</span>
            <div className="p-2 rounded-lg bg-red-50 text-red-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-display font-bold text-red-600">{pendingEnrollments}</span>
            <span className="text-[10px] text-red-500 font-semibold block mt-1 font-mono animate-pulse">
              Requires evaluation
            </span>
          </div>
        </div>

      </div>

      {/* Analytical Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live enrollment trend chart */}
        <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-display font-bold text-sm text-stone-900 uppercase">Enrollment Trends Comparison</h3>
              <p className="text-[11px] text-stone-400 mt-0.5">Historical growth breakdown per academic cycle</p>
            </div>
            <div className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded border border-stone-200 text-[10px] font-semibold text-stone-600">
              <TrendingUp className="w-3 select-none text-stsn-gold" />
              <span>+100.0% SY Growth</span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {chartDataSchoolYear.map((item) => {
              const barWidth = Math.round((item.count / maxYearCount) * 100);
              return (
                <div key={item.year} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-stone-600">{item.year}</span>
                    <span className="text-stone-900 font-mono font-bold">{item.count} Enrollees</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-100 text-[10px] text-stone-400 font-mono">
            <span>Projection limits: 1,000 enrollees</span>
            <span>Refreshes dynamically</span>
          </div>
        </div>

        {/* Students by department donut chart mock representation */}
        <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display font-bold text-sm text-stone-900 uppercase">Students by Department</h3>
                <p className="text-[11px] text-stone-400 mt-0.5">Demography of Basic Education vs Tertiary Academics</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
              {/* SVG circular representation */}
              <div className="w-32 h-32 relative flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background loop */}
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="#E5E0D5" strokeWidth="2.5" />
                  {/* First segment (Basic Edu - basicPercentage) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="transparent"
                    stroke="#4A3728"
                    strokeWidth="2.5"
                    strokeDasharray={`${basicPercentage} 100`}
                  />
                  {/* Second segment (College) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="transparent"
                    stroke="#C5A059"
                    strokeWidth="2.5"
                    strokeDasharray={`${collegePercentage} 100`}
                    strokeDashoffset={`-${basicPercentage}`}
                  />
                </svg>
                {/* Center label */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-bold text-stone-900 font-display">{students.length}</span>
                  <span className="text-[8px] text-stone-400 uppercase font-mono">Total Head</span>
                </div>
              </div>

              {/* Legends details */}
              <div className="flex-1 space-y-3.5 w-full">
                <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-stsn-brown flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-stone-800">Basic Education</span>
                      <span className="text-[9.5px] text-stone-400 block">K-12 Grade 7 to 12</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-stone-950">{basicCount} head</span>
                    <span className="text-[10px] text-stsn-brown font-semibold block">{basicPercentage}%</span>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-stsn-gold flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-stone-800">College Department</span>
                      <span className="text-[9.5px] text-stone-400 block">Undergrad Degree Courses</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-stone-950">{collegeCount} head</span>
                    <span className="text-[10px] text-stsn-gold font-semibold block">{collegePercentage}%</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <p className="text-[10px] text-stone-400 border-t border-stone-100 pt-4 mt-2 italic">
            *Includes active students enrolled across STEM, HUMSS, BSIT, and BSBA structures.
          </p>
        </div>

      </div>

      {/* Lower Multi-Grid: Announcements vs Upcoming Scheds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Announcements */}
        <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-sm text-stone-900 uppercase flex items-center gap-2">
                <Bell className="w-4 h-4 text-stsn-gold" />
                Live Notice Board & Bulletins
              </h3>
            </div>

            <div className="space-y-4">
              {announcements.slice(0, 3).map((ann) => (
                <div key={ann.id} className="p-4 bg-stsn-cream/40 hover:bg-stsn-cream border border-stsn-beige/60 rounded-xl transition duration-300">
                  <div className="flex justify-between font-semibold">
                    <span className="text-xs font-bold text-stsn-brown">{ann.title}</span>
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                      ann.category === "Billing" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      ann.category === "Academic" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                      "bg-stone-100 text-stone-600 border border-stone-200"
                    }`}>
                      {ann.category}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">{ann.content}</p>
                  <div className="flex justify-between items-center mt-3 text-[10px] text-stone-400 font-mono">
                    <span>By: {ann.author}</span>
                    <span>Date published: {ann.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming School Events Cal */}
        <div className="bg-white p-6 rounded-xl border border-stsn-beige shadow-sm">
          <h3 className="font-display font-bold text-sm text-stone-900 uppercase flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-stsn-gold" />
            Extracurricular Registry
          </h3>

          <div className="space-y-4">
            {events.map((ev) => (
              <div key={ev.id} className="flex gap-4 border-b border-stone-100 pb-3 last:border-none last:pb-0">
                <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-stsn-beige flex flex-col items-center justify-center text-stsn-brown font-display font-semibold border border-stsn-gold/20 shadow-sm">
                  <span className="text-[10px] font-mono leading-none tracking-widest uppercase-none">JUN</span>
                  <span className="text-base font-bold leading-none mt-1">{ev.date.split("-")[2]}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-stone-900">{ev.title}</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">{ev.description}</p>
                  <span className="text-[9px] uppercase tracking-wide font-bold font-mono text-stsn-gold mt-1 block">
                    Scope: {ev.department}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-stsn-cream border border-stsn-beige rounded-xl text-center">
            <span className="text-[10px] text-stone-400 block uppercase tracking-wider font-mono">STSN Sports Council Bulletin</span>
            <p className="text-xs font-semibold text-stsn-brown mt-1">Golden Lions General Assembly approaches</p>
          </div>
        </div>

      </div>

    </div>
  );
}
