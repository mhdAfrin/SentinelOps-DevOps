import { useState } from 'react'
import { Trash2, UserPlus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import SearchBox from '../components/ui/SearchBox'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import { useData } from '../context/DataContext'
import { apiErrorMessage } from '../services/api'
import { formatDateTime, initials } from '../utils/format'

// User Management Module: single role (DevOps Engineer). Kept simple - add a
// teammate, remove one, nothing more complex than that.
export default function Users() {
  const { users, addUser, removeUser } = useData()
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const rows = users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()))

  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName || !trimmedEmail) return setError('Name and email are both required.')

    setSubmitting(true)
    try {
      await addUser({ name: trimmedName, email: trimmedEmail })
      setName('')
      setEmail('')
      setError('')
      setAdding(false)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add that engineer.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="Users" subtitle="DevOps engineers who can sign in to SentinelOps and be assigned incidents.">
        <button className="btn btn--primary" onClick={() => setAdding(true)}>
          <UserPlus size={16} aria-hidden="true" /> Add DevOps engineer
        </button>
      </PageHeader>

      <Card flush>
        <div className="toolbar">
          <span className="muted">
            {users.length} DevOps {users.length === 1 ? 'engineer' : 'engineers'}
          </span>
          <SearchBox value={q} onChange={setQ} placeholder="Search users" />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Last active</th>
                <th>
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="person">
                      <span className="avatar">{initials(u.name)}</span>
                      <strong>{u.name}</strong>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={u.status === 'Active' ? 'pill pill--good' : 'pill pill--muted'}>{u.status}</span>
                  </td>
                  <td>{formatDateTime(u.lastActive)}</td>
                  <td>
                    <button className="btn btn--sm" onClick={() => removeUser(u.id)} aria-label={`Remove ${u.name}`}>
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <EmptyState title="No users match" hint="Try a different search term." />}
      </Card>

      {adding && (
        <Modal title="Add DevOps engineer" onClose={() => setAdding(false)}>
          <form className="field-stack" onSubmit={submit}>
            <label className="field">
              <span>Full name</span>
              <div className="field__control">
                <input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
              </div>
            </label>
            <label className="field">
              <span>Email</span>
              <div className="field__control">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add engineer'}
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}
