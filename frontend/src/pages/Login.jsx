import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { useAuth } from '../context/AuthContext'

// Every account is a DevOps Engineer - that is the only role SentinelOps has.
const DEMO = [
  { name: 'Dinuka Kavinda', email: 'devops@sentinelops.io', password: 'devops123' },
  { name: 'Ishara Fernando', email: 'ishara@sentinelops.io', password: 'ishara123' },
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(DEMO[0].email)
  const [password, setPassword] = useState(DEMO[0].password)
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
            SentinelOps watches your Web, API and Database servers, opens an incident the moment something looks
            wrong, and gives your DevOps team one place to fix it.
          </p>
        </div>
        <ul className="login__points">
          <li>Live CPU and memory health for every server</li>
          <li>Incidents created automatically from abnormal readings</li>
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

          <div className="demo">
            <p>Demo DevOps engineer accounts (frontend only)</p>
            <div className="demo__list">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  className="btn btn--sm"
                  onClick={() => {
                    setEmail(d.email)
                    setPassword(d.password)
                    setError('')
                  }}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
