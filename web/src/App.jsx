import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Components/user/Login';
import Register from './Components/user/Register';
import Home from './Components/User/Home.jsx';
import Dashboard from './Components/Admin/Dashboard.jsx';
import Profile from './Components/User/Profile.jsx';
import AdminProfile from './Components/Admin/AdminProfile.jsx';
import EditProfile from './Components/User/EditProfile.jsx';
import AdminEditProfile from './Components/Admin/AdminEditProfile.jsx';
import ForgotPassword from './Components/User/ForgotPassword.jsx';
import ResetPassword from './Components/User/ResetPassword.jsx'; 
import ChangePassword from './Components/User/ChangePassword.jsx';
import TrunksDetection from './Components/User/TrunksDetection.jsx';
import AboutUs from './Components/User/AboutUs.jsx';
import AboutRubber from './Components/User/AboutRubber.jsx';
import Maps from './Components/User/Maps.jsx';


function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root "/" to Login page */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/admin/profile/edit" element={<AdminEditProfile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/trunks-detection" element={<TrunksDetection />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/about-rubber" element={<AboutRubber />} />
        <Route path="/maps" element={<Maps />} />


        

      </Routes>
    </Router>
  );
}

export default App;
