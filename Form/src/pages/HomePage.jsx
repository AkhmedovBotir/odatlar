import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listSurveys } from '../api/surveys'
import { parseDescriptionDelta } from '../lib/deltaUtils'

export default function HomePage() {
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listSurveys()
      .then(setSurveys)
      .catch((err) => setError(err.message || 'Ro\'yxat yuklanmadi'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-svh bg-[#f0ebf8] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="border-t-[10px] border-violet-600 bg-white px-8 py-8 shadow-sm">
          <h1 className="text-3xl font-normal text-slate-800">So'rovnomalar</h1>
          <p className="mt-2 text-sm text-slate-600">
            Nashr qilingan so'rovnomalardan birini tanlang va javob bering.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {loading && (
            <div className="rounded-lg bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Yuklanmoqda...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && surveys.length === 0 && (
            <div className="rounded-lg bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Hozircha nashr qilingan so'rovnomalar yo'q.
            </div>
          )}

          {surveys.map((survey, index) => (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/surveys/${survey.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-300 hover:shadow-md"
              >
                <h2 className="text-lg font-medium text-violet-700">{survey.title}</h2>
                {survey.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                    {parseDescriptionDelta(survey.description)}
                  </p>
                )}
                <p className="mt-3 text-xs text-slate-400">
                  {survey.questionCount ?? 0} ta savol
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
