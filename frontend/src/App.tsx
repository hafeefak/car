import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BookingsPage } from "./pages/BookingsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FollowUpsPage } from "./pages/FollowUpsPage";
import { InventoryPage } from "./pages/InventoryPage";
import { LeadsPage } from "./pages/LeadsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
      <Route path="/follow-ups" element={<ProtectedRoute><FollowUpsPage /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
