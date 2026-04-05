import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';

const Login = lazy(() => import('./pages/Login'));
const Landing = lazy(() => import('./pages/Landing'));
const About = lazy(() => import('./pages/About'));
const PublicEvents = lazy(() => import('./pages/PublicEvents'));
const PublicEventDetail = lazy(() => import('./pages/PublicEventDetail'));
const PublicEventRegister = lazy(() => import('./pages/PublicEventRegister'));
const EventsCalendar = lazy(() => import('./pages/EventsCalendar'));
const PublicBlog = lazy(() => import('./pages/PublicBlog'));
const BlogPostDetail = lazy(() => import('./pages/BlogPostDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const Membership = lazy(() => import('./pages/Membership'));
const CPD = lazy(() => import('./pages/CPD'));
const Resources = lazy(() => import('./pages/Resources'));
const Downloads = lazy(() => import('./pages/Downloads'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Projects = lazy(() => import('./pages/Projects'));
const Gallery = lazy(() => import('./pages/Gallery'));
const MemberRegister = lazy(() => import('./pages/MemberRegister'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Members = lazy(() => import('./pages/Members'));
const MemberNew = lazy(() => import('./pages/MemberNew'));
const MemberDetail = lazy(() => import('./pages/MemberDetail'));
const MembershipTypes = lazy(() => import('./pages/MembershipTypes'));
const Events = lazy(() => import('./pages/Events'));
const Payments = lazy(() => import('./pages/Payments'));
const Savings = lazy(() => import('./pages/Savings'));
const Contributions = lazy(() => import('./pages/Contributions'));
const EventRegister = lazy(() => import('./pages/EventRegister'));
const EventTicket = lazy(() => import('./pages/EventTicket'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const Reports = lazy(() => import('./pages/Reports'));
const VerifyReceipt = lazy(() => import('./pages/VerifyReceipt'));
const Pay = lazy(() => import('./pages/Pay'));
const PublicEventPay = lazy(() => import('./pages/PublicEventPay'));

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-slate-50 text-sm text-slate-500">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/verify-receipt/:receiptNumber" element={<VerifyReceipt />} />
            <Route path="/pay" element={<Pay />} />
            <Route path="/event-pay" element={<PublicEventPay />} />
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Landing />} />
              <Route path="about" element={<About />} />
              <Route path="membership" element={<Membership />} />
              <Route path="cpd" element={<CPD />} />
              <Route path="events" element={<PublicEvents />} />
              <Route path="events/calendar" element={<EventsCalendar />} />
              <Route path="events/:id" element={<PublicEventDetail />} />
              <Route path="events/:id/register" element={<PublicEventRegister />} />
              <Route path="resources" element={<Resources />} />
              <Route path="downloads" element={<Downloads />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="projects" element={<Projects />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="blog" element={<PublicBlog />} />
              <Route path="blog/:slug" element={<BlogPostDetail />} />
              <Route path="contact" element={<Contact />} />
              <Route path="register" element={<MemberRegister />} />
            </Route>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="members/new" element={<MemberNew />} />
              <Route path="members/:id" element={<MemberDetail />} />
              <Route path="membership-types" element={<MembershipTypes />} />
              <Route path="events" element={<Events />} />
              <Route path="events/:eventId/register" element={<EventRegister />} />
              <Route path="events/:eventId/ticket/:regId" element={<EventTicket />} />
              <Route path="check-in" element={<CheckIn />} />
              <Route path="payments" element={<Payments />} />
              <Route path="savings" element={<Savings />} />
              <Route path="contributions" element={<Contributions />} />
              <Route path="reports" element={<Reports />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
