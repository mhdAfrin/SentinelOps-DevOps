import { Search } from 'lucide-react'

export default function SearchBox({ value, onChange, placeholder = 'Search...' }) {
  return (
    <label className="searchbox">
      <Search size={16} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  )
}
