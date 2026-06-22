// "use client";

// import { useState } from "react";
// import toast from "react-hot-toast";

// export default function SecurityTab() {
//   const [form, setForm] = useState({
//     currentPassword: "",
//     newPassword: "",
//     confirmPassword: "",
//   });

//   const [is2FAEnabled, setIs2FAEnabled] = useState(false);

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleUpdatePassword = () => {
//     if (form.newPassword !== form.confirmPassword) {
//       toast.error("Passwords do not match!");
//       return;
//     }

//     toast.success("Password updated successfully!");
//     setForm({
//       currentPassword: "",
//       newPassword: "",
//       confirmPassword: "",
//     });
//   };

//   return (
//     <div className="space-y-6">

//       {/* 🔐 Security Settings Card */}
//       <div className="bg-white rounded-xl shadow-sm border p-8">
//         <h2 className="text-xl font-semibold text-gray-800">
//           Security Settings
//         </h2>
//         <p className="text-gray-500 mt-1">
//           Manage your password and security
//         </p>

//         <div className="mt-6 space-y-6 max-w-lg">
//           <div>
//             <label className="block text-sm font-medium text-gray-600">
//               Current Password
//             </label>
//             <input
//               type="password"
//               name="currentPassword"
//               value={form.currentPassword}
//               onChange={handleChange}
//               className="mt-2 w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-600">
//               New Password
//             </label>
//             <input
//               type="password"
//               name="newPassword"
//               value={form.newPassword}
//               onChange={handleChange}
//               className="mt-2 w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-600">
//               Confirm New Password
//             </label>
//             <input
//               type="password"
//               name="confirmPassword"
//               value={form.confirmPassword}
//               onChange={handleChange}
//               className="mt-2 w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
//             />
//           </div>

//           <button
//             onClick={handleUpdatePassword}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
//           >
//             Update Password
//           </button>
//         </div>
//       </div>

//       {/* 🔐 Two-Factor Authentication Card */}
//       <div className="bg-white rounded-xl shadow-sm border p-8 flex justify-between items-center">
//         <div>
//           <h2 className="text-lg font-semibold text-gray-800">
//             Two-Factor Authentication
//           </h2>
//           <p className="text-gray-500 mt-1">
//             Add an extra layer of security
//           </p>

//           <div className="mt-4">
//             <p className="text-sm font-medium text-gray-700">
//               Enable 2FA
//             </p>
//             <p className="text-sm text-gray-500">
//               Require a verification code in addition to your password
//             </p>
//           </div>
//         </div>

//         {/* Toggle Switch */}
//         <button
//           onClick={() => {
//             setIs2FAEnabled(!is2FAEnabled);
//             toast.success(
//               !is2FAEnabled
//                 ? "Two-Factor Authentication Enabled"
//                 : "Two-Factor Authentication Disabled"
//             );
//           }}
//           className={`relative inline-flex h-6 w-11 items-center rounded-full transition
//             ${is2FAEnabled ? "bg-blue-600" : "bg-gray-300"}`}
//         >
//           <span
//             className={`inline-block h-4 w-4 transform rounded-full bg-white transition
//               ${is2FAEnabled ? "translate-x-6" : "translate-x-1"}`}
//           />
//         </button>
//       </div>

//     </div>
//   );
// }



"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function SecurityTab() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //  Password Strength Logic
  const getPasswordStrength = (password) => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  };

  const strength = getPasswordStrength(form.newPassword);

  const strengthLabel = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  const handleUpdatePassword = () => {
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (strength < 3) {
      toast.error("Password is too weak!");
      return;
    }

    toast.success("Password updated successfully!");
    setForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="space-y-8">
      {/*  Security Settings Card */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-rose-500/5 rounded-full blur-[100px]" />

        <div className="relative z-10">
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">
            Security Settings
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">
            Manage your password and security
          </p>

          <div className="mt-10 space-y-8 max-w-xl">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-slate-100 text-sm font-medium focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/5 outline-none transition-all placeholder:text-slate-800"
              />
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-slate-100 text-sm font-medium focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-800"
              />

              {/*  Strength Meter */}
              {form.newPassword && (
                <div className="mt-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.2)] ${strengthColors[strength]
                        }`}
                      style={{ width: `${(strength / 4) * 100}%` }}
                    />
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-widest mt-3 text-slate-500">
                    Strength:{" "}
                    <span className={`transition-colors duration-500 ${strength > 2 ? "text-emerald-500" : "text-rose-500"}`}>
                      {strengthLabel[strength]}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-slate-100 text-sm font-medium focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-800"
              />
            </div>

            <button
              onClick={handleUpdatePassword}
              className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/*  Two-Factor Authentication */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-8 shadow-2xl flex justify-between items-center group relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-slate-100 uppercase tracking-tight">
              Two-Factor Authentication
            </h2>
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${is2FAEnabled ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-950 text-slate-600 border-slate-800"}`}>
              {is2FAEnabled ? "Active" : "Disabled"}
            </span>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">
            Add an extra layer of security
          </p>

          <div className="mt-6 space-y-1">
            <p className="text-sm font-black text-slate-400 uppercase tracking-tight">
              Enable 2FA
            </p>
            <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
              Require a verification code in addition to your password
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIs2FAEnabled(!is2FAEnabled);
            toast.success(
              !is2FAEnabled
                ? "Two-Factor Authentication Enabled"
                : "Two-Factor Authentication Disabled"
            );
          }}
          className={`relative inline-flex h-8 w-14 items-center rounded-xl transition-all duration-500 shadow-inner overflow-hidden border
            ${is2FAEnabled ? "bg-emerald-500 border-emerald-400 shadow-emerald-500/20" : "bg-slate-950 border-slate-800"}`}
        >
          <div className={`absolute inset-0 bg-emerald-400 opacity-0 transition-opacity ${is2FAEnabled ? "opacity-20 animate-pulse" : ""}`} />
          <span
            className={`relative z-10 inline-block h-6 w-6 transform rounded-lg bg-white shadow-xl transition-all duration-500
              ${is2FAEnabled ? "translate-x-7" : "translate-x-1"}`}
          />
        </button>
      </div>
    </div>
  );
}