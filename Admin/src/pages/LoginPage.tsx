import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSnackbar } from '../context/SnackbarContext'
import { getApiErrorMessage } from '../lib/apiMessage'
import { Button, Input, PasswordInput } from '../components/ui/Form'

export function LoginPage() {
  const { login } = useAuth()
  const snackbar = useSnackbar()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await login({ username, password })
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Serverga ulanib bo\'lmadi'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <Lock className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Kirish</h1>
        <p className="mt-1 text-sm text-slate-500">
          Admin hisobingiz bilan tizimga kiring
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            required
            autoComplete="username"
          />
          <PasswordInput
            label="Parol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Kirish...' : 'Tizimga kirish'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
