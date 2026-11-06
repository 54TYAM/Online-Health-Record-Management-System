import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Stethoscope
} from 'lucide-react';
import Navbar from '../components/navigation/Navbar';

const Landing = () => {
  return (
    <div className="min-h-screen bg-ivory-100 text-charcoal-800 font-sans selection:bg-sage-200 selection:text-forest-900 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Editorial Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-sage-200 text-forest-900 border border-sage-300">
                <ShieldCheck size={14} className="text-forest-800" />
                <span>Clinical Record Infrastructure</span>
              </div>

              <h1 className="font-serif font-editorial text-4xl sm:text-5xl lg:text-6xl text-forest-900 font-semibold tracking-tight leading-[1.12]">
                Longitudinal health records and clinical consultations, unified with strict confidentiality.
              </h1>

              <p className="text-lg text-charcoal-700 leading-relaxed max-w-2xl font-normal">
                MediCare coordinates patient appointments, physician diagnoses, and verified prescription records under server-enforced role access controls. Designed for clinical rigor, patient autonomy, and dependable records.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/register"
                  className="px-6 py-3 bg-forest-800 hover:bg-forest-700 text-ivory-100 font-medium text-sm rounded-md shadow-subtle transition flex items-center gap-2"
                >
                  Register as Patient <ArrowRight size={16} />
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-ivory-50 hover:bg-sand-100 text-charcoal-800 font-medium text-sm rounded-md border border-sand-300 transition"
                >
                  Practitioner & Admin Access
                </Link>
              </div>

              <div className="pt-6 border-t border-sand-200 grid grid-cols-3 gap-6 text-xs text-charcoal-600">
                <div>
                  <span className="font-semibold text-charcoal-900 block text-sm tabular-nums">100% Patient-Owned</span>
                  <span>Records viewable only with authorized consultation</span>
                </div>
                <div>
                  <span className="font-semibold text-charcoal-900 block text-sm">Role-Isolated</span>
                  <span>Separation between patient, doctor, and admin</span>
                </div>
                <div>
                  <span className="font-semibold text-charcoal-900 block text-sm">Zero Ad Tracking</span>
                  <span>Pure clinical software without third-party brokers</span>
                </div>
              </div>
            </div>

            {/* Right Column: Authentic Component Preview (No remote images) */}
            <div className="lg:col-span-5">
              <div className="bg-ivory-50 rounded-xl border border-sand-300 shadow-card p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-sand-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-forest-700"></span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">Live Clinical Record Sample</span>
                  </div>
                  <span className="text-[11px] font-mono text-charcoal-500 bg-sand-100 px-2 py-0.5 rounded">ID: REC-4920</span>
                </div>

                {/* Patient / Doctor Summary Card */}
                <div className="bg-white p-4 rounded-lg border border-sand-200 shadow-subtle space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-medium text-forest-700 uppercase tracking-wide">Diagnosis</span>
                      <h4 className="font-serif font-medium text-lg text-charcoal-900 leading-snug">
                        Mild Bronchitis with Secondary Cough
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-sage-200 text-forest-900 border border-sage-300">
                      Approved Visit
                    </span>
                  </div>

                  <div className="text-xs text-charcoal-600 flex items-center gap-4">
                    <span className="flex items-center gap-1 font-medium text-charcoal-800">
                      <Stethoscope size={13} className="text-forest-700" /> Dr. Eleanor Vance
                    </span>
                    <span className="text-charcoal-400">•</span>
                    <span>Internal Medicine</span>
                  </div>

                  <div className="bg-ivory-100 p-3 rounded border border-sand-200 text-xs">
                    <span className="font-semibold text-charcoal-900 block mb-1">Prescription & Protocol:</span>
                    <p className="text-charcoal-700 font-mono text-[11px] leading-relaxed">
                      1. Amoxicillin 500mg tid x 7 days<br />
                      2. Albuterol inhaler 90mcg prn wheezing<br />
                      3. Rest & follow-up if symptoms persist past day 10
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-1">
                    <span>Recorded: Oct 18, 2026</span>
                    <span className="text-forest-800 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Digitally Authenticated
                    </span>
                  </div>
                </div>

                {/* Consultation Queue Item */}
                <div className="bg-sand-100/60 p-3.5 rounded-lg border border-sand-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-forest-800 text-ivory-100 flex items-center justify-center font-medium text-xs">
                      EV
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-charcoal-900">Upcoming Follow-Up Consultation</div>
                      <div className="text-[11px] text-charcoal-600 flex items-center gap-2">
                        <Calendar size={11} /> Oct 25, 2026 at 10:30 AM
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-forest-100 text-forest-800 border border-forest-200">
                    Confirmed
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-20 bg-ivory-50 border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-forest-800 mb-2 block">System Pillars</span>
            <h2 className="font-serif font-editorial text-3xl sm:text-4xl text-forest-900 font-semibold tracking-tight">
              A healthcare product structured for clinical accuracy and patient sovereignty.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-white p-7 rounded-xl border border-sand-200 shadow-subtle space-y-4">
              <div className="w-10 h-10 rounded-lg bg-sage-200 text-forest-800 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h3 className="font-serif text-xl font-semibold text-charcoal-900">
                Permanent Medical Records
              </h3>
              <p className="text-sm text-charcoal-600 leading-relaxed font-normal">
                Diagnoses and prescriptions are permanently associated with patient accounts. Doctors author records only after verified consultations, preventing forged entries and unauthorized edits.
              </p>
              <ul className="text-xs text-charcoal-700 space-y-2 pt-2 border-t border-sand-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-forest-700" />
                  Chronological visit timeline
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-forest-700" />
                  Immutable record author attribution
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-7 rounded-xl border border-sand-200 shadow-subtle space-y-4">
              <div className="w-10 h-10 rounded-lg bg-sage-200 text-forest-800 flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <h3 className="font-serif text-xl font-semibold text-charcoal-900">
                Conflict-Free Scheduling
              </h3>
              <p className="text-sm text-charcoal-600 leading-relaxed font-normal">
                Book appointments by date and available time slot. Server-enforced double-booking prevention guarantees doctors cannot be booked twice for the same window.
              </p>
              <ul className="text-xs text-charcoal-700 space-y-2 pt-2 border-t border-sand-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-forest-700" />
                  Slot collision prevention
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-forest-700" />
                  Strict state machine: pending → approved → completed
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-7 rounded-xl border border-sand-200 shadow-subtle space-y-4">
              <div className="w-10 h-10 rounded-lg bg-sage-200 text-forest-800 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-serif text-xl font-semibold text-charcoal-900">
                Hospital Administration
              </h3>
              <p className="text-sm text-charcoal-600 leading-relaxed font-normal">
                Physicians are onboarded exclusively by authorized clinical administrators. Public registration creates patient accounts only, eliminating credential fraud.
              </p>
              <ul className="text-xs text-charcoal-700 space-y-2 pt-2 border-t border-sand-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-forest-700" />
                  Privileged doctor onboarding
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-forest-700" />
                  Account audit & safety controls
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / Workflow */}
      <section id="how-it-works" className="py-20 border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-forest-800 mb-2 block">Care Coordination Workflow</span>
            <h2 className="font-serif font-editorial text-3xl sm:text-4xl text-forest-900 font-semibold tracking-tight">
              From appointment request to documented diagnosis.
            </h2>
            <p className="text-charcoal-600 text-sm mt-3">
              Every stage of care creates transparent, audit-ready states between patient and practitioner.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Patient Booking",
                desc: "Patients search verified doctors by specialty, review consultation fees, and select an open consultation slot."
              },
              {
                step: "02",
                title: "Physician Review",
                desc: "The assigned physician reviews their clinical queue and confirms the appointment into their daily schedule."
              },
              {
                step: "03",
                title: "Consultation & Record",
                desc: "During or after the visit, the doctor authors a structured medical record containing diagnoses and prescriptions."
              },
              {
                step: "04",
                title: "Review & Feedback",
                desc: "The patient accesses their medical record at any time and can submit feedback on completed consultations."
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-ivory-50 p-6 rounded-lg border border-sand-200 space-y-3">
                <span className="text-xs font-mono font-bold text-forest-800 bg-sage-200 px-2 py-0.5 rounded">
                  {item.step}
                </span>
                <h4 className="font-serif font-semibold text-charcoal-900 text-base">{item.title}</h4>
                <p className="text-xs text-charcoal-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Comparison Table */}
      <section className="py-20 bg-ivory-50 border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-forest-800 mb-2 block">Access Boundaries</span>
            <h2 className="font-serif font-editorial text-3xl text-forest-900 font-semibold">
              Explicit role capabilities and security safeguards.
            </h2>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl border border-sand-200 shadow-subtle">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sand-200 bg-sand-100/50 text-xs text-charcoal-700 uppercase tracking-wider">
                  <th className="p-4 font-semibold">Capability</th>
                  <th className="p-4 font-semibold text-center">Patient</th>
                  <th className="p-4 font-semibold text-center">Physician</th>
                  <th className="p-4 font-semibold text-center">Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200 text-xs">
                <tr>
                  <td className="p-4 font-medium text-charcoal-900">Self-Registration via Web Portal</td>
                  <td className="p-4 text-center font-semibold text-forest-800">Permitted</td>
                  <td className="p-4 text-center text-charcoal-500">Admin Onboarded Only</td>
                  <td className="p-4 text-center text-charcoal-500">Seed / Authorized Only</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-charcoal-900">Schedule Appointments</td>
                  <td className="p-4 text-center font-semibold text-forest-800">Yes (With any doctor)</td>
                  <td className="p-4 text-center text-charcoal-500">No</td>
                  <td className="p-4 text-center text-charcoal-500">No</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-charcoal-900">Modify Appointment Status</td>
                  <td className="p-4 text-center text-charcoal-700">Cancel Own Only</td>
                  <td className="p-4 text-center font-semibold text-forest-800">Approve / Complete / Cancel (Assigned Only)</td>
                  <td className="p-4 text-center text-forest-800">Full Oversight</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-charcoal-900">Medical Record Access</td>
                  <td className="p-4 text-center font-semibold text-forest-800">Own Records Only</td>
                  <td className="p-4 text-center text-charcoal-700">Only Patients with Approved Consultation</td>
                  <td className="p-4 text-center text-charcoal-700">Audit / Compliance View</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-charcoal-900">Author Prescriptions & Records</td>
                  <td className="p-4 text-center text-charcoal-500">Restricted</td>
                  <td className="p-4 text-center font-semibold text-forest-800">Permitted (Verified Patients)</td>
                  <td className="p-4 text-center text-charcoal-500">Restricted</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-charcoal-900">User Account Safety & Blocking</td>
                  <td className="p-4 text-center text-charcoal-500">Restricted</td>
                  <td className="p-4 text-center text-charcoal-500">Restricted</td>
                  <td className="p-4 text-center font-semibold text-forest-800">Full Authority</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust & Confidentiality Section */}
      <section id="privacy" className="py-20 border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-forest-900 text-ivory-100 rounded-2xl p-8 sm:p-12 border border-forest-800 space-y-8">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-sage-300">Confidentiality Standards</span>
              <h2 className="font-serif font-editorial text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                Honest privacy guarantees based on architectural controls.
              </h2>
              <p className="text-sage-200 text-sm leading-relaxed">
                Rather than relying on marketing slogans, MediCare enforces patient privacy directly in backend middleware and database schemas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-forest-800">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sage-200 font-semibold text-sm">
                  <Lock size={16} /> Server-Side Record Authorization
                </div>
                <p className="text-xs text-sage-300/80 leading-relaxed">
                  Possessing a database ID is never sufficient. The API evaluates verified relationship policies before any medical entry is read or updated.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sage-200 font-semibold text-sm">
                  <ShieldCheck size={16} /> Rate-Limited & Scoped Sessions
                </div>
                <p className="text-xs text-sage-300/80 leading-relaxed">
                  Authentication endpoints enforce automated brute-force limits. Blocked user accounts are rejected dynamically across all routes.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sage-200 font-semibold text-sm">
                  <CheckCircle2 size={16} /> Input Validation Guardrails
                </div>
                <p className="text-xs text-sage-300/80 leading-relaxed">
                  Payload sizes are capped at 10KB. Request parameters and bodies are validated against strict Zod schemas to reject injection attacks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 bg-ivory-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="font-serif font-editorial text-3xl sm:text-4xl text-forest-900 font-semibold">
            Ready to organize your health records?
          </h2>
          <p className="text-sm text-charcoal-600 max-w-lg mx-auto">
            Create your patient account in minutes to schedule appointments with our medical staff and access your permanent records.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/register"
              className="px-6 py-3 bg-forest-800 hover:bg-forest-700 text-ivory-100 font-medium text-sm rounded-md shadow-subtle transition"
            >
              Register as Patient
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 bg-white hover:bg-sand-100 text-charcoal-800 font-medium text-sm rounded-md border border-sand-300 transition"
            >
              Practitioner Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-sand-200 bg-ivory-50 text-charcoal-600 text-xs py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-sand-200">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-forest-800 text-ivory-100 flex items-center justify-center font-serif text-xs font-bold">
                M
              </span>
              <span className="font-serif text-base font-semibold text-forest-900">MediCare</span>
              <span className="text-sand-400">•</span>
              <span>Health Record Management System</span>
            </div>
            <div className="flex gap-6 text-charcoal-600">
              <Link to="/login" className="hover:text-forest-900">Sign In</Link>
              <Link to="/register" className="hover:text-forest-900">Patient Registration</Link>
              <a href="#how-it-works" className="hover:text-forest-900">Care Model</a>
              <a href="#privacy" className="hover:text-forest-900">Confidentiality</a>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center text-charcoal-500 gap-2">
            <p>&copy; {new Date().getFullYear()} MediCare Health System. All clinical rights reserved.</p>
            <p>Designed for authenticated patients, licensed physicians, and designated staff.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
