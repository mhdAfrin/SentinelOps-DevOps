import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)
    if (!result.ok) return setError(result.error)
    navigate(location.state?.from?.pathname ?? '/', { replace: true })
  }

  return (
    <div className="login">
      <aside className="login__brand">
        <Logo />
        <div className="login__pitch">
          <h1>Catch failures before your users do.</h1>
          <p>
            View server health, track incidents, and manage alerts from one dashboard.
          </p>
        </div>
        <ul className="login__points">
          <li>CPU, memory, and disk metrics</li>
          <li>Incident tracking and alert acknowledgement</li>
          <li>Add as many DevOps engineers to the team as you need</li>
        </ul>
      </aside>

      <main className="login__panel">
        <form className="login__form" onSubmit={submit} noValidate>
          <h2>Sign in</h2>
          <p className="muted">Use your SentinelOps account to continue.</p>

          <label className="field">
            <span>Email</span>
            <div className="field__control">
              <Mail size={17} aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="field__control">
              <Lock size={17} aria-hidden="true" />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="field__toggle"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </main>
    </div>
  )
}
