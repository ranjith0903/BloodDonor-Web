import { Route, Routes, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { useEffect } from "react";

import Navbar from "./components/Navbar";
import FindDonors from "./pages/FindDonors";
import FindStats from "./pages/FindStats";
import FindCampaign from "./pages/FindCampaign";

import { useUserStore } from "./store/useUserStore";
import ProfilePage from "./pages/ProfilePage";
import RegisterCampaign from "./pages/RegisterCampaign";
import AdminPage from "./pages/AdminPage"

import { DeleteUser } from "./pages/DeleteUser";

import DeleteCampaign from "./pages/DeleteCampaign";

import { BloodStatsPage } from "./pages/BloodStatsPage";
import About from "./pages/About";
import AIPredictionsPage from "./pages/AIPredictionsPage";
import AdvancedAnalytics from "./components/AdvancedAnalytics";
import AchievementsPage from "./pages/AchievementsPage";
import BloodBankFinder from "./pages/BloodBankFinder.jsx";
import ContactRequests from "./pages/ContactRequests.jsx";
import EmergencyAlertPage from "./pages/EmergencyAlertPage.jsx";
import EmergencyCallPage from "./pages/EmergencyCallPage.jsx";
import EmergencyCallNotifier from "./components/EmergencyCallNotifier.jsx";
import DonationSchedulerPage from "./pages/DonationSchedulerPage.jsx";

import { Toaster } from "react-hot-toast";

function App() {
  const { user, checkAuth, checkingAuth } = useUserStore();
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />}></Route>
        <Route
          path="/profile"
          element={!user ? <LoginPage /> : <ProfilePage />}
        ></Route>
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/" />}
        ></Route>
        <Route
          path="/logout"
          element={!user ? <LoginPage /> : <Navigate to="/" />}
        ></Route>
        <Route
          path="/signup"
          element={!user ? <SignUpPage /> : <Navigate to="/" />}
        ></Route>

        <Route path="/findDonors" element={<FindDonors />}></Route>
        <Route path="/findCampaign" element={<FindCampaign />}></Route>
        <Route path="/ai-predictions" element={<AIPredictionsPage />}></Route>
        <Route path="/analytics" element={<AdvancedAnalytics />}></Route>
        <Route path="/achievements" element={<AchievementsPage />}></Route>
        <Route path="/blood-banks" element={<BloodBankFinder />}></Route>
        <Route path="/contact-requests" element={<ContactRequests />}></Route>
        <Route path="/emergency-alerts" element={<EmergencyAlertPage />}></Route>
        <Route path="/emergency-calls" element={<EmergencyCallPage />}></Route>
        <Route path="/schedule-donation" element={<DonationSchedulerPage />}></Route>

        <Route
          path="/findStats"
          element={user?.role === "admin" ? <FindStats /> : <Navigate to="/" />}
        ></Route>

        <Route path="/registerCampaign" element={<RegisterCampaign />} />

        <Route
          path="/admin"
          element={user?.role === "admin" ? <AdminPage /> : <Navigate to="/" />}
        />
        <Route
          path="/deleteuser"
          element={
            user?.role === "admin" ? <DeleteUser /> : <Navigate to="/" />
          }
        />
        <Route
          path="/deletecampaign"
          element={
            user?.role === "admin" ? <DeleteCampaign /> : <Navigate to="/" />
          }
        />
        <Route
          path="/bloodstats"
          element={
            user?.role === "admin" ? <BloodStatsPage /> : <Navigate to="/" />
          }
        />
        <Route
          path="/about"
          element={<About />}
        />
      </Routes>

      {/* Global Components */}
      <EmergencyCallNotifier />
      <Toaster position="top-right" />
    </>
  );
}

export default App;
