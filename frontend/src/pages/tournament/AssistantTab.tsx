import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState, type FormEvent } from 'react'
import { askAssistant } from '../../api/ai'
import { errorMessage } from '../../api/client'
import type { AssistantResponse } from '../../api/types'
import ErrorMessage from '../../components/ErrorMessage'
import Button from '../../components/ui/Button'

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

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" strokeLinejoin="round" />
    </svg>
  )
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
  if (axios.isAxiosError(error) && error.response?.status === 504) {
    return "L'assistente ci sta mettendo troppo (probabilmente l'AI gira senza GPU). Riprova più tardi."
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
        ...previous,
        { question: text, response },
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
    <section className="flex flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ai-soft text-ai">
          <SparkleIcon />
        </span>
        <div>
          <h2 className="font-bold text-ink">Assistente del torneo</h2>
          <p className="text-xs text-muted">Risponde con i dati veri del torneo</p>
        </div>
      </header>

      <div className="flex flex-col gap-4 bg-night/40 p-5">
        {history.length === 0 && !waiting && (
          <p className="text-sm text-muted">Fai una domanda su classifica, risultati e statistiche del torneo.</p>
        )}
        {history.map((exchange, index) => (
          <div key={index} className="flex flex-col gap-2">
            <p className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-raised px-4 py-2.5 text-sm text-ink">
              {exchange.question}
            </p>
            {exchange.response.status === 'OK' ? (
              <div className="flex max-w-[92%] flex-col gap-2 self-start">
                <p className="whitespace-pre-line rounded-2xl rounded-bl-md border border-line bg-panel px-4 py-3 text-sm leading-relaxed text-reading">
                  {exchange.response.answer}
                </p>
                {exchange.response.toolsUsed.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted">Dati consultati:</span>
                    {[...new Set(exchange.response.toolsUsed)].map((tool) => (
                      <span key={tool} className="rounded-full bg-ai-soft px-2 py-0.5 font-semibold text-ai">
                        {TOOL_LABELS[tool] ?? tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="max-w-[92%] self-start rounded-2xl rounded-bl-md border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
                L'assistente non è disponibile in questo momento. Riprova più tardi.
              </p>
            )}
          </div>
        ))}
        {waiting && (
          <div className="flex flex-col gap-2">
            <p className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-raised px-4 py-2.5 text-sm text-ink">
              {waitingQuestions[0]}
            </p>
            <p className="flex items-center gap-2 self-start text-sm text-muted">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ai-line border-t-ai" />
              Sto consultando i dati del torneo...
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 border-t border-line p-5">
        <label htmlFor="assistant-question" className="block text-sm font-semibold text-reading">
          La tua domanda
        </label>
        <textarea
          id="assistant-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={MAX_LENGTH}
          rows={2}
          placeholder="Es. Quanti punti ha lo Straw Hat FC?"
          className="w-full resize-y rounded-lg border border-line bg-field px-3 py-2 text-ink placeholder:text-muted focus:border-ai focus:outline-none"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">
            {question.length}/{MAX_LENGTH}
          </span>
          <Button type="submit" variant="ai" disabled={waiting || question.trim().length === 0}>
            Chiedi
          </Button>
        </div>
        {ask.error && <ErrorMessage message={assistantError(ask.error)} />}
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="text-xs text-muted">Prova a chiedere:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => send(suggestion)}
              disabled={waiting}
              className="rounded-full border border-line bg-field px-3 py-1.5 text-sm text-reading transition-colors hover:border-ai hover:text-ink disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSuggestions(randomSuggestions())}
            className="px-1 py-1.5 text-sm font-semibold text-ai hover:underline"
          >
            Altre domande
          </button>
        </div>
      </form>
    </section>
  )
}
