import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SolanaProvider } from '../components/solana-provider'
import { WalletConnectProvider } from './providers/WalletConnectProvider'
import { LocalWalletProvider } from './providers/LocalWalletProvider'
import { SecurityProvider } from './components/SecurityProvider'
import { Navbar } from './components/Navbar'
import { Toast } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import CreateChallenge from './pages/CreateChallenge'
import ChallengeDetail from './pages/ChallengeDetail'
import SubmitEvidence from './pages/SubmitEvidence'
import Profile from './pages/Profile'
import Settlement from './pages/Settlement'
import Notifications from './pages/Notifications'

function App() {
  console.log('App component is rendering')
  
  return (
    <ErrorBoundary>
      <SolanaProvider>
        <WalletConnectProvider>
          <LocalWalletProvider>
            <SecurityProvider>
              <Router>
                <div className="min-h-screen bg-gray-50">
                  <Routes>
                    <Route path="/" element={<><Navbar /><Home /></>} />
                    <Route path="/create" element={<><Navbar hideBottomNav={true} /><CreateChallenge /></>} />
                    <Route path="/challenge/:id" element={<><Navbar hideBottomNav /><ChallengeDetail /></>} />
                    <Route path="/challenge/:id/submit-evidence" element={<><Navbar hideBottomNav={true} /><SubmitEvidence /></>} />
                    <Route path="/profile" element={<><Navbar /><Profile /></>} />
                    <Route path="/notifications" element={<><Navbar /><Notifications /></>} />
                    <Route path="/settlement/:id" element={<><Navbar /><Settlement /></>} />
                  </Routes>
                  <Toast />
                </div>
              </Router>
            </SecurityProvider>
          </LocalWalletProvider>
        </WalletConnectProvider>
      </SolanaProvider>
    </ErrorBoundary>
  )
}

export default App
