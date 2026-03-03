// RubberSense/web/App.jsx
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
import AboutUs from './Components/User/AboutUs.jsx';
import AboutRubber from './Components/User/AboutRubber.jsx';
import Maps from './Components/User/Maps.jsx';
import ContactUs from './Components/User/ContactUs.jsx';
import AdminContactMessages from './Components/Admin/AdminContactMessages.jsx';
import Mail from './Components/User/Mail.jsx';
import Announcement from './Components/Admin/Announcement.jsx';
import CommunityBlogspot from './Components/User/CommunityBlogspot.jsx';
import UserProfile from './Components/User/UserProfile.jsx';
import Message from './Components/User/Message.jsx';
import UserList from './Components/Admin/UserList.jsx';
import Weather from './Components/User/Weather.jsx';
import Market from './Components/User/Market.jsx';
import UserReport from './Components/Admin/UserReport.jsx';
import Notifications from './Components/User/Notifications.jsx';
import LatexDetection from './Components/User/LatexDetection.jsx';
import TrunksDetection from './Components/User/TrunksDetection.jsx';
import LeafDetection from './Components/User/LeafDetection.jsx';
import ChatbotWidget from './Components/User/ChatbotWidget.jsx';
import AnalysisHistory from './Components/User/AnalysisHistory';
import AnalysisDetails from './Components/User/AnalysisDetails';
import GetAnnouncement from './Components/User/GetAnnouncement.jsx';
import LandingHome from './Components/landingpage/LandingHome.jsx';
import LandingAboutUs from './Components/landingpage/LandingAboutUs.jsx';
import LandingAboutRubber from './Components/landingpage/LandingAboutRubber.jsx';
import LandingContactUs from './Components/landingpage/LandingContactUs.jsx';
import LandingChatbotWidget from './Components/landingpage/LandingChatbotWidget.jsx';
import AnalysisLogs from './Components/Admin/AnalysisLogs.jsx';
import AnalysisStatistics from './Components/Admin/AnalysisStatistics.jsx';


function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root "/" to Login page */}
        <Route path="/" element={<Navigate to="/landinghome" replace />} />

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
        <Route path="/about" element={<AboutUs />} />
        <Route path="/about-rubber" element={<AboutRubber />} />
        <Route path="/maps" element={<Maps />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/admin/contact-messages" element={<AdminContactMessages />} />
        <Route path="/mail" element={<Mail />} />
        <Route path="/admin/announcements" element={<Announcement />} />
        <Route path="/community-blogspot" element={<CommunityBlogspot />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/messages" element={<Message />} />
        <Route path="/messages/:userId" element={<Message />} />
        <Route path="/admin/users" element={<UserList />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/market" element={<Market />} />
        <Route path="/admin/user-reports" element={<UserReport />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/latex-detection" element={<LatexDetection />} />
        <Route path="trunks-detection" element={<TrunksDetection />} />
        <Route path="leaf-detection" element={<LeafDetection />} />
        <Route path="chatbot" element={<ChatbotWidget />} />
        <Route path="/analysis/history" element={<AnalysisHistory />} />
        <Route path="/analysis/:type/:id" element={<AnalysisDetails />} />
        <Route path="/announcements" element={<GetAnnouncement />} />
        <Route path="/landinghome" element={<LandingHome />} />
        <Route path="/landingabout" element={<LandingAboutUs />} />
        <Route path="/landingrubber" element={<LandingAboutRubber />} />
        <Route path="/landingcontact" element={<LandingContactUs />} />
        <Route path="/landingchatbot" element={<LandingChatbotWidget />} />
        <Route path="/admin/analysis-logs" element={<AnalysisLogs />} />
        <Route path="/admin/analysis-stats" element={<AnalysisStatistics />} />
        
       
      </Routes>
    </Router>
  );
}

export default App;
