import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout, ProtectedRoute } from './components'
import {
  LoginPage,
  ProfileSetupPage,
  RegisterPage,
  VerifyPage,
  WelcomePage,
} from './pages/AuthPages'
import { ChatPage, TopicsPage } from './pages/ChatPages'
import { LearnPage, ReviewPage, VocabularyPage } from './pages/LearnPages'
import { AudioSettingsPage, MemoriesPage, PrivacyPage, ProfilePage } from './pages/ProfilePages'
import './App.less'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding/profile" element={<ProfileSetupPage />} />
        <Route path="/chat/:conversationId" element={<ChatPage />} />
        <Route element={<MainLayout />}>
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/memories" element={<MemoriesPage />} />
          <Route path="/settings/audio" element={<AudioSettingsPage />} />
          <Route path="/settings/privacy" element={<PrivacyPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
