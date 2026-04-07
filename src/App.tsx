import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OnboardingForm from './components/OnboardingForm';
import AdminPortal from './components/AdminPortal';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Merchant Onboarding Form */}
        <Route path="/" element={<OnboardingForm />} />
        
        {/* Admin Portal */}
        <Route path="/admin" element={<AdminPortal />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
