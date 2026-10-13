import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import SearchBox from '../components/ui/SearchBox'
import EmptyState from '../components/ui/EmptyState'
import { HealthStatus, appTone } from '../components/ui/Badge'
import { useData } from '../context/DataContext'
import { formatMs } from '../utils/format'

export default function Applications() {
  const { apps } = useData()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [filter, setFilter] = useState('all')

  const setQuery = (v) => setParams(v ? { q: v } : {}, { replace: true })
  const isUnhealthy = (a) => a.status !== 'Healthy'

  const rows = apps.filter(
    (a) =>
      (filter === 'all' || (filter === 'healthy' ? !isUnhealthy(a) : isUnhealthy(a))) &&
      `${a.name} ${a.host} ${a.version}`.toLowerCase().includes(q.toLowerCase()),
  )

  const tabs = [
    { value: 'all', label: 'All', count: apps.length },
    { value: 'healthy', label: 'Healthy', count: apps.filter((a) => !isUnhealthy(a)).length },
    { value: 'issues', label: 'Needs attention', count: apps.filter(isUnhealthy).length },
  ]

  return (
    <>
      <PageHeader title="Applications" subtitle="Version, response time and uptime for each monitored application." />
      <Card flush>
        <div className="toolbar">
          <Tabs tabs={tabs} value={filter} onChange={setFilter} label="Filter applications" />
          <SearchBox value={q} onChange={setQuery} placeholder="Search applications" />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Application</th>
                <th>Version</th>
                <th>Status</th>
                <th>Response time</th>
                <th>Uptime</th>
                <th>Running on</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="strong">{a.name}</td>
                  <td>{a.version}</td>
                  <td>
                    <HealthStatus tone={appTone(a.status)} label={a.status} />
                  </td>
                  <td>{formatMs(a.responseMs)}</td>
                  <td>{a.uptime}%</td>
                  <td>{a.host}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <EmptyState title="No applications match" hint="Try a different filter or search term." />}
      </Card>
    </>
  )
}
