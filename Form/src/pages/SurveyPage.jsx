import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSurvey } from '../api/surveys'
import SurveyForm from '../components/survey/SurveyForm'

function LoadingState() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#f0ebf8]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#f0ebf8] px-4">
      <div className="max-w-md rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-medium text-slate-800">So'rovnoma topilmadi</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <Link
          to="/"
          className="mt-6 inline-block text-sm font-medium text-violet-700 hover:underline"
        >
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  )
}

export default function SurveyPage() {
  const { slug } = useParams()
  const [survey, setSurvey] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    getSurvey(slug)
      .then((data) => {
        if (active) setSurvey(data)
      })
      .catch((err) => {
        if (active) setError(err.message || 'So\'rovnoma yuklanmadi')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [slug])

  if (loading) return <LoadingState />
  if (error || !survey) return <ErrorState message={error || 'So\'rovnoma mavjud emas'} />

  return (
    <div className="min-h-svh bg-[#f0ebf8]">
      <SurveyForm survey={survey} />
    </div>
  )
}
