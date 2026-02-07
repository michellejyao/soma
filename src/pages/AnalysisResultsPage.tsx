import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PageContainer } from '../components/PageContainer'
import { AnalysisResultsModal } from '../components/AnalysisResultsModal'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export function AnalysisResultsPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('analysis_results')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw new Error(error.message)
        setResults(data || [])
      } catch (e: any) {
        setError(e.message || 'Failed to fetch results')
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [])

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Analysis Results History</h1>
      {loading && <div className="text-slate-600 dark:text-white/70">Loading...</div>}
      {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-500/10 border border-red-400 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded">{error}</div>}
      <div className="space-y-4">
        {results.map((result) => (
          <button
            key={result.id}
            className="w-full text-left bg-slate-100 dark:bg-white/5 rounded-lg p-4 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/10"
            onClick={() => {
              setSelectedResult(result)
              setModalOpen(true)
            }}
          >
            <div className="font-semibold text-lg text-slate-900 dark:text-white mb-1">{new Date(result.created_at).toLocaleString()}</div>
            <div className="text-slate-700 dark:text-white/70 text-sm truncate">{result.summary}</div>
          </button>
        ))}
      </div>
      <AnalysisResultsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        result={selectedResult}
      />
    </PageContainer>
  )
}
