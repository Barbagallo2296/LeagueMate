import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState, type FormEvent } from 'react'
import { askAssistant } from '../../api/ai'
import { errorMessage } from '../../api/client'
import type { AssistantResponse } from '../../api/types'
import ErrorMessage from '../../components/ErrorMessage'

const MAX_LENGTH = 300

const SUGGESTIONS = [
  'Chi è in testa alla classifica?',
  'Chi è ultimo in classifica?',
  'Quale squadra ha la miglior difesa?',
  'Quale squadra ha il miglior attacco?',
  'Quale squadra ha perso più partite?',
  'Quale squadra ha pareggiato più volte?',
  "Com'è andata la giornata 1?",
  "Com'è andata l'ultima giornata giocata?",
  'Quante partite mancano alla fine del torneo?',
  'Quanti gol sono stati segnati in totale?',
  'Qual è la media gol a partita?',
  'Quante squadre partecipano al torneo?',
]

const SUGGESTIONS_SHOWN = 3

function randomSuggestions(): string[] {
  return [...SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, SUGGESTIONS_SHOWN)
}

const TOOL_LABELS: Record<string, string> = {
  get_standings: 'Classifica',
  get_tournament_stats: 'Statistiche',
  get_round: 'Giornata',
  get_team_matches: 'Partite di una squadra',
}

interface Exchange {
  question: string
  response: AssistantResponse
}

function assistantError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.status === 429) {
    const seconds = error.response.headers['retry-after']
    return `Hai fatto troppe domande. Riprova tra ${seconds ?? 'qualche'} secondi.`
  }
  return errorMessage(error)
}

export default function AssistantTab({ tournamentId }: { tournamentId: number }) {
  const queryClient = useQueryClient()
  const historyKey = ['assistant', tournamentId]
  const askKey = ['assistant', tournamentId, 'ask']
  const [question, setQuestion] = useState('')
  const [suggestions, setSuggestions] = useState(randomSuggestions)

  const { data: history = [] } = useQuery<Exchange[]>({
    queryKey: historyKey,
    queryFn: () => [],
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const waitingQuestions = useMutationState({
    filters: { mutationKey: askKey, status: 'pending' },
    select: (mutation) => mutation.state.variables as string,
  })
  const waiting = waitingQuestions.length > 0

  const ask = useMutation({
    mutationKey: askKey,
    mutationFn: (text: string) => askAssistant(tournamentId, text),
    onSuccess: (response, text) => {
      queryClient.setQueryData<Exchange[]>(historyKey, (previous = []) => [
        { question: text, response },
        ...previous,
      ])
    },
  })

  function send(text: string) {
    const trimmed = text.trim()
    if (trimmed.length > 0 && !waiting) {
      ask.mutate(trimmed, { onSuccess: () => setQuestion('') })
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    send(question)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-white p-5 shadow">
        <h3 className="font-semibold text-slate-800">Chiedi all'assistente del torneo</h3>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={MAX_LENGTH}
          rows={2}
          placeholder="Es. Quanti punti ha lo Straw Hat FC?"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            {question.length}/{MAX_LENGTH}
          </span>
          <button
            type="submit"
            disabled={waiting || question.trim().length === 0}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            Chiedi
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-sm text-slate-500">Prova a chiedere:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => send(suggestion)}
              disabled={waiting}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSuggestions(randomSuggestions())}
            className="px-1 text-sm font-medium text-blue-700 hover:underline"
          >
            Altre domande
          </button>
        </div>
        {waiting && (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            L'assistente sta consultando i dati del torneo per rispondere a: "{waitingQuestions[0]}"
          </p>
        )}
        {ask.error && <ErrorMessage message={assistantError(ask.error)} />}
      </form>

      {history.map((exchange, index) => (
        <article key={history.length - index} className="space-y-2 rounded-xl bg-white p-5 shadow">
          <p className="font-medium text-slate-800">{exchange.question}</p>
          {exchange.response.status === 'OK' ? (
            <>
              <p className="whitespace-pre-line text-slate-700">{exchange.response.answer}</p>
              {exchange.response.toolsUsed.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-slate-500">Dati consultati:</span>
                  {[...new Set(exchange.response.toolsUsed)].map((tool) => (
                    <span key={tool} className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                      {TOOL_LABELS[tool] ?? tool}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-amber-700">L'assistente non è disponibile in questo momento. Riprova più tardi.</p>
          )}
        </article>
      ))}
    </div>
  )
}
