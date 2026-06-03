'use client'

import { useState, useTransition } from 'react'
import { renameHouseholdAction } from '@/app/(dashboard)/settings/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Props {
  householdId: string
  currentName: string
}

export default function RenameHouseholdSection({ householdId, currentName }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(currentName)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    setError('')
    startTransition(async () => {
      const result = await renameHouseholdAction(householdId, trimmed)
      if (result?.error) {
        setError(result.error)
      } else {
        setEditing(false)
      }
    })
  }

  function handleCancel() {
    setEditing(false)
    setName(currentName)
    setError('')
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-stone-700">{name}</span>
        <Button variant="ghost" onClick={() => setEditing(true)}>
          Rename
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Input
        label="Household name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
        autoFocus
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button
          fullWidth
          disabled={isPending || !name.trim() || name.trim() === currentName}
          onClick={handleSave}
        >
          {isPending ? 'Saving...' : 'Save name'}
        </Button>
        <Button variant="ghost" fullWidth onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
