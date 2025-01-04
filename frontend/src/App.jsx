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
        <Route path="/about" element={<About />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
