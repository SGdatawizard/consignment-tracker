import { useState } from 'react'
import { useAuth } from '../data/auth'
import Field, { inputStyle } from '../components/Field'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await signIn(email, password)
    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'That email and password combination was not recognised. Check for typos and try again.'
          : err.message
      )
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-5)',
        background: 'var(--navy)',
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--size-xl)' }}>Consignment tracker</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)', marginTop: 'var(--space-1)' }}>
            Sign in to see your work.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            style={{
              background: 'var(--danger-tint)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--size-sm)',
              fontWeight: 500,
            }}
          >
            {error}
          </p>
        )}

        <Field id="email" label="Email">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            style={inputStyle}
          />
        </Field>

        <Field id="password" label="Password">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={inputStyle}
          />
        </Field>

        <button
          type="submit"
          disabled={busy}
          style={{
            height: 'var(--control-height-lg)',
            borderRadius: 'var(--radius)',
            background: 'var(--navy)',
            color: 'var(--text-on-dark)',
            fontWeight: 700,
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
          Forgotten your password? Ask the office to reset it for you.
        </p>
      </form>
    </div>
  )
}
