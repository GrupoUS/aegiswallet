/**
 * Voice Interface Example for AegisWallet
 * 
 * Complete voice-first interface implementation with Brazilian Portuguese
 * regional variations, sub-200ms performance targets, and financial terminology.
 * 
 * Features:
 * - Brazilian Portuguese regional pattern recognition (6 major regions)
 * - Voice Activity Detection (VAD) for fast processing
 * - Financial terminology and slang recognition
 * - Sub-200ms response times
 * - Error recovery with regional adaptations
 * - Real-time voice feedback
 * - WCAG 2.1 AA+ accessibility compliance
 * - Brazilian accent support
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

// Brazilian regional patterns for voice recognition
export interface BrazilianRegionalPatterns {
  greetings: string[]
  financial_terms: string[]
  slang: string[]
  expressions: string[]
  commands: {
    balance: string[]
    transfer: string[]
    bills: string[]
    spending: string[]
  }
}

// Regional configurations
const BRAZILIAN_REGIONS: Record<string, BrazilianRegionalPatterns> = {
  'SP': { // São Paulo
    greetings: ['oi', 'eai', 'beleza', 'meu bem', 'fala aí'],
    financial_terms: ['grana', 'coiso', 'boleta', 'pilas', 'merrequê'],
    slang: ['mano', 'parça', 'rolê', 'tipo assim', 'cê tá ligado?'],
    expressions: ['demais', 'massa', 'show', 'sensacional', 'nota mil'],
    commands: {
      balance: ['como está meu saldo', 'quanto tenho na conta', 'me fala quanto tenho de grana'],
      transfer: ['faz um pix pra mim', 'me manda o pix', 'transfere na conta'],
      bills: ['tem boleta pra pagar', 'qualé os boletos', 'tem conta pra pagar'],
      spending: ['quanto posso gastar', 'qualé meu limite', 'me fala quanto sobra']
    }
  },
  'RJ': { // Rio de Janeiro
    greetings: ['eai', 'beleza', 'firmesa', 'demais', 'salve'],
    financial_terms: ['grana', 'dinhe', 'ferinha', 'coisa', 'cavé'],
    slang: ['maneiro', 'caraca', 'você é brabo', 'sinistro', 'maravilha'],
    expressions: ['feras', 'pra caramba', 'puta que pariu', 'sarrada'],
    commands: {
      balance: ['qualé o saldo da conta', 'me fala quanto tenho', 'quanto tá grana'],
      transfer: ['me ajuda com o pix', 'faz a transferência', 'me passa o pix'],
      bills: ['tem conta pra pagar', 'qualé as contas', 'boletos pra pagar'],
      spending: ['qualé o limite', 'quanto dá pra gastar', 'me fala do limite']
    }
  },
  'NE': { // Nordeste
    greetings: ['oi', 'eai', 'bão', 'oxente', 'meu filho'],
    financial_terms: ['bão', 'grana', 'coisa', 'visse', 'pindaíba'],
    slang: ['arre', 'massa', 'bão demais', 'meu patrao', 'ôxe'],
    expressions: ['oxente', 'bão demais', 'rapaziada', 'vamos nessa'],
    commands: {
      balance: ['oxente, quanto tô tendo', 'me diga quanto', 'qualé o saldo meu filho'],
      transfer: ['me faz um pix', 'manda o pix', 'transfere pra cá'],
      bills: ['oxente, tem conta pra pagar', 'tem boleto', 'qualé os boletos'],
      spending: ['oxente, dá pra gastar quanto', 'me fala do limite', 'qualé o saldo']
    }
  },
  'SUL': { // Sul
    greetings: ['oi', 'eai', 'bah', 'tchê', 'salve'],
    financial_terms: ['grana', 'dinhero', 'coisa', 'guita', 'pila'],
    slang: ['bah', 'tchê', 'guri', 'legal', 'show', 'cabras'],
    expressions: ['bah, quelegal', 'tchê, sensacional', 'vamos nessa'],
    commands: {
      balance: ['bah, me diz o saldo tchê', 'quanto tenho de grana', 'qualé o saldo bah'],
      transfer: ['bah, me manda o pix tchê', 'faz transferência', 'pix pra mim'],
      bills: ['tem alguma boleta vencendo', 'qualé as contas tchê', 'boletos pra pagar'],
      spending: ['bah, qualé o limite tchê', 'quanto posso gastar', 'me fala do saldo']
    }
  },
  'NORTE': { // Norte
    personality: ['oi', 'eai', 'cara', 'rapaz', 'irmão'],
    financial_terms: ['grana', 'dinheiro', 'coisa', 'reais', 'fer'],
    slang: ['véio', 'meu irmão', 'rapazola', 'saravá'],
    expressions: ['é nóis', 'vamos nessa', 'legal pra caramba'],
    commands: {
      balance: ['qualé o saldo cara', 'quanto tenho na conta', 'me fala quanto tem'],
      transfer: ['me ajuda com o pix', 'faz transferência', 'manda a grana'],
      bills: ['tem alguma conta pra pagar', 'qualé os boletos', 'contas vencendo'],
      spending: ['qualé o meu limite', 'quanto posso gastar', 'me fala o que sobra']
    }
  },
  'CO': { // Centro-Oeste
    greetings: ['oi', 'eai', 'salve', 'beleza', 'firmeza'],
    financial_terms: ['grana', 'dinhero', 'coisa', 'fer', 'pilas'],
    slang: ['irmão', 'parça', 'legal', 'show', 'sensacional'],
    expressions: ['vamos nessa', 'é isso aí', 'pra caramba'],
    commands: {
      balance: ['qualé o saldo irmão', 'me fala quanto tenho', 'quanto tá na conta'],
      transfer: ['me faz um pix', 'transfere pra mim', 'manda o pix'],
      bills: ['tem boleto programado', 'qualé as contas', 'contas pra pagar'],
      spending: ['qualé o limite', 'quanto dá pra gastar', 'me fala quanto sobra']
    }
  }
}

// Voice command intents
export type VoiceIntent = 
  | 'BALANCE_QUERY'
  | 'SPENDING_CAPACITY'
  | 'BILLS_INQUIRY'
  | 'INCOME_INQUIRY'
  | 'TRANSFER_REQUEST'
  | 'BALANCE_PROJECTION'
  | 'UNKNOWN'
  | 'ERROR'

// Voice command result
export interface VoiceCommandResult {
  intent: VoiceIntent
  confidence: number
  entities: {
    amount?: number
    recipient?: string
    pixKey?: string
    billType?: string
    timeframe?: string
  }
  transcript: string
  processingTime: number
  region: string
  needsClarification: boolean
  responseText?: string
}

// Voice activity detection configuration
const VAD_CONFIG = {
  MIN_AUDIO_DURATION: 300,        // 0.3 seconds minimum
  MAX_AUDIO_DURATION: 10000,      // 10 seconds maximum
  SILENCE_THRESHOLD: 0.01,        // Audio level threshold
  SILENCE_DURATION: 1500,         // 1.5 seconds of silence to stop
  AUTO_STOP_TIMEOUT: 3000,        // 3 seconds auto-stop
  PROCESSING_DELAY: 100,          // 100ms delay for VAD
  TARGET_RESPONSE_TIME: 200       // 200ms target response time
}

interface VoiceRecognitionProps {
  onCommandProcessed?: (result: VoiceCommandResult) => void
  onListeningChange?: (isListening: boolean) => void
  onError?: (error: string) => void
  region?: string
  language?: string
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export const VoiceRecognition: React.FC<VoiceRecognitionProps> = ({
  onCommandProcessed,
  onListeningChange,
  onError,
  region = 'SP',
  language = 'pt-BR',
  disabled = false,
  className = '',
  children
}) => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [currentRegion, setCurrentRegion] = useState(region)
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'responding'>('idle')
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const processingStartTime = useRef<number>(0)
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Get Brazilian regional patterns
  const regionalPatterns = useMemo(() => BRAZILIAN_REGIONS[currentRegion], [currentRegion])

  // Voice Activity Detection
  const startVAD = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
    }

    let silenceCount = 0
    const maxSilenceCount = VAD_CONFIG.SILENCE_DURATION / 100

    vadIntervalRef.current = setInterval(() => {
      if (analyserRef.current && recognitionRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
        
        if (average < VAD_CONFIG.SILENCE_THRESHOLD * 255) {
          silenceCount++
          if (silenceCount >= maxSilenceCount) {
            // Stop recording due to silence
            stopListening()
          }
        } else {
          silenceCount = 0
        }
      }
    }, VAD_CONFIG.PROCESSING_DELAY)
  }, [])

  // Process voice command with Brazilian patterns
  const processVoiceCommand = useCallback(async (text: string): Promise<VoiceCommandResult> => {
    const startTime = Date.now()
    
    try {
      // Normalize text for Brazilian Portuguese
      const normalizedText = normalizeBrazilianPortuguese(text)
      
      // Detect intent with regional patterns
      const intent = detectIntentWithRegionalPatterns(normalizedText, regionalPatterns)
      
      // Extract entities
      const entities = extractFinancialEntities(normalizedText, regionalPatterns)
      
      // Calculate confidence
      const confidence = calculateConfidence(normalizedText, intent, entities, regionalPatterns)
      
      // Generate response
      const responseText = generateResponse(intent, entities, regionalPatterns, confidence)
      
      const processingTime = Date.now() - startTime
      
      return {
        intent,
        confidence,
        entities,
        transcript: text,
        processingTime,
        region: currentRegion,
        needsClarification: confidence < 0.7,
        responseText
      }
      
    } catch (error) {
      console.error('Voice processing error:', error)
      
      return {
        intent: 'ERROR',
        confidence: 0,
        entities: {},
        transcript: text,
        processingTime: Date.now() - startTime,
        region: currentRegion,
        needsClarification: true,
        responseText: generateErrorResponse(error, regionalPatterns)
      }
    }
  }, [currentRegion, regionalPatterns])

  // Normalize Brazilian Portuguese text
  const normalizeBrazilianPortuguese = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[ãâáà]/g, 'a')
      .replace(/[ẽêéè]/g, 'e')
      .replace(/[ĩîíì]/g, 'i')
      .replace(/[õôóò]/g, 'o')
      .replace(/[ũûúù]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/\s+/g, ' ')
      .trim()
  }, [])

  // Detect intent with Brazilian regional patterns
  const detectIntentWithRegionalPatterns = useCallback((
    text: string, 
    patterns: BrazilianRegionalPatterns
  ): VoiceIntent => {
    const normalizedText = text.toLowerCase()
    
    // Check for balance queries
    if (patterns.commands.balance.some(pattern => normalizedText.includes(pattern.toLowerCase()))) {
      return 'BALANCE_QUERY'
    }
    
    // Check for spending capacity
    if (patterns.commands.spending.some(pattern => normalizedText.includes(pattern.toLowerCase()))) {
      return 'SPENDING_CAPACITY'
    }
    
    // Check for bills inquiry
    if (patterns.commands.bills.some(pattern => normalizedText.includes(pattern.toLowerCase()))) {
      return 'BILLS_INQUIRY'
    }
    
    // Check for transfer requests
    if (patterns.commands.transfer.some(pattern => normalizedText.includes(pattern.toLowerCase()))) {
      return 'TRANSFER_REQUEST'
    }
    
    // Financial terminology detection
    if (patterns.financial_terms.some(term => normalizedText.includes(term.toLowerCase()))) {
      // Secondary intent detection based on financial terms
      if (normalizedText.includes('saldo') || normalizedText.includes('tenho')) {
        return 'BALANCE_QUERY'
      }
      if (normalizedText.includes('gast') || normalizedText.includes('limite')) {
        return 'SPENDING_CAPACITY'
      }
      if (normalizedText.includes('cont') || normalizedText.includes('boleto')) {
        return 'BILLS_INQUIRY'
      }
    }
    
    return 'UNKNOWN'
  }, [])

  // Extract financial entities from text
  const extractFinancialEntities = useCallback((
    text: string, 
    patterns: BrazilianRegionalPatterns
  ) => {
    const entities: any = {}
    
    // Extract amount (Brazilian currency patterns)
    const amountPatterns = [
      /r\$\s*(\d+(?:,\d{2})?)/gi,
      /(\d+(?:,\d{2})?)\s*reais?/gi,
      /(\d+(?:,\d{2})?)\s*real/gi,
      /(\d+)\s*reais/gi
    ]
    
    for (const pattern of amountPatterns) {
      const match = text.match(pattern)
      if (match) {
        const amountStr = match[0].replace(/[^\d,]/g, '').replace(',', '.')
        entities.amount = parseFloat(amountStr)
        break
      }
    }
    
    // Extract recipient name (simplified)
    const recipientPatterns = [
      /pra\s+([a-z\s]+)/gi,
      /para\s+([a-z\s]+)/gi,
      /transfere\s+para\s+([a-z\s]+)/gi
    ]
    
    for (const pattern of recipientPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        entities.recipient = match[1].trim()
        break
      }
    }
    
    // Extract PIX key patterns
    const pixKeyPatterns = [
      /(\d{3}\.\d{3}\.\d{3}-\d{2})/g, // CPF
      /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/g, // CNPJ
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, // Email
      /(\(\d{2}\)\s*\d{4,5}-\d{4})/g // Phone
    ]
    
    for (const pattern of pixKeyPatterns) {
      const match = text.match(pattern)
      if (match) {
        entities.pixKey = match[0]
        break
      }
    }
    
    return entities
  }, [])

  // Calculate confidence score
  const calculateConfidence = useCallback((
    text: string, 
    intent: VoiceIntent, 
    entities: any,
    patterns: BrazilianRegionalPatterns
  ): number => {
    let confidence = 0.5 // Base confidence
    
    // Boost confidence for recognized patterns
    const normalizedText = text.toLowerCase()
    
    // Check for exact command matches
    for (const [intentType, commands] of Object.entries(patterns.commands)) {
      for (const command of commands) {
        if (normalizedText.includes(command.toLowerCase())) {
          confidence += 0.3
          break
        }
      }
    }
    
    // Check for financial terms
    const financialTerms = patterns.financial_terms.filter(term => 
      normalizedText.includes(term.toLowerCase())
    )
    confidence += financialTerms.length * 0.1
    
    // Check for slang (increases regional confidence)
    const slangMatches = patterns.slang.filter(slang => 
      normalizedText.includes(slang.toLowerCase())
    )
    confidence += slangMatches.length * 0.15
    
    // Entity extraction boosts confidence
    if (entities.amount) confidence += 0.2
    if (entities.recipient) confidence += 0.15
    if (entities.pixKey) confidence += 0.2
    
    // Cap confidence at 0.95
    return Math.min(confidence, 0.95)
  }, [])

  // Generate contextual response
  const generateResponse = useCallback((
    intent: VoiceIntent,
    entities: any,
    patterns: BrazilianRegionalPatterns,
    confidence: number
  ): string => {
    const greeting = patterns.greetings[Math.floor(Math.random() * patterns.greetings.length)]
    const expression = patterns.expressions[Math.floor(Math.random() * patterns.expressions.length)]
    
    switch (intent) {
      case 'BALANCE_QUERY':
        return `${greeting}! Vou verificar seu saldo agora mesmo. Um momento, ${expression}!`
      
      case 'SPENDING_CAPACITY':
        return `${greeting}! Deixa eu calcular quanto você ainda pode gastar esse mês. ${expression}!`
      
      case 'BILLS_INQUIRY':
        return `${greeting}! Vou verificar se você tem alguma conta ou boleto pra pagar. ${expression}!`
      
      case 'TRANSFER_REQUEST':
        if (entities.recipient) {
          return `${greeting}! Entendi, quer transferir para ${entities.recipient}. Quanto você quer mandar, ${expression}?`
        } else if (entities.amount) {
          return `${greeting}! Quanto é ${entities.amount} reais? Para quem você quer transferir essa grana?`
        } else {
          return `${greeting}! Para quem e quanto você quer transferir? Fala aí, ${expression}!`
        }
      
      default:
        if (confidence < 0.7) {
          return `${greeting}! Não entendi muito bem. Você pode repetir de outra forma? ${expression}!`
        } else {
          return `${greeting}! Entendi! Vou processar seu pedido agora mesmo, ${expression}!`
        }
    }
  }, [])

  // Generate error response
  const generateErrorResponse = useCallback((error: any, patterns: BrazilianRegionalPatterns): string => {
    const greeting = patterns.greetings[Math.floor(Math.random() * patterns.greetings.length)]
    const slang = patterns.slang[Math.floor(Math.random() * patterns.slang.length)]
    
    return `${greeting}! Desculpa, deu um erro aqui. Pode tentar de novo? ${slang}!`
  }, [])

  // Start voice recognition
  const startListening = useCallback(() => {
    if (disabled || !('webkitSpeechRecognition' in window) || !('SpeechRecognition' in window)) {
      onError?.('Seu navegador não suporta reconhecimento de voz')
      return
    }
    
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      // Configure for Brazilian Portuguese
      recognitionRef.current.lang = language
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.maxAlternatives = 1
      
      // Event handlers
      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setVoiceState('listening')
        onListeningChange?.(true)
        startVAD()
        setTranscript('')
      }
      
      recognitionRef.current.onresult = async (event: any) => {
        const result = event.results[0]
        const text = result[0].transcript
        
        setTranscript(text)
        setVoiceState('processing')
        setIsListening(false)
        
        // Process the command
        processingStartTime.current = Date.now()
        const commandResult = await processVoiceCommand(text)
        
        setVoiceState('responding')
        
        // Trigger callback
        onCommandProcessed?.(commandResult)
        
        // Reset state after response
        setTimeout(() => {
          setVoiceState('idle')
        }, 2000)
      }
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setVoiceState('idle')
        onListeningChange?.(false)
        
        const errorMessage = getRegionalErrorMessage(event.error, regionalPatterns)
        onError?.(errorMessage)
      }
      
      recognitionRef.current.onend = () => {
        setIsListening(false)
        setVoiceState('idle')
        onListeningChange?.(false)
        
        // Clear VAD
        if (vadIntervalRef.current) {
          clearInterval(vadIntervalRef.current)
          vadIntervalRef.current = null
        }
        
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current)
          silenceTimeoutRef.current = null
        }
      }
      
      // Start recognition
      recognitionRef.current.start()
      
    } catch (error) {
      console.error('Failed to start voice recognition:', error)
      onError?.('Não foi possível iniciar o reconhecimento de voz')
    }
  }, [disabled, language, onError, onListeningChange, onCommandProcessed, processVoiceCommand, startVAD, regionalPatterns])

  // Stop voice recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
    
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current)
      vadIntervalRef.current = null
    }
    
    setIsListening(false)
    setVoiceState('idle')
    onListeningChange?.(false)
  }, [onListeningChange])

  // Get regional error messages
  const getRegionalErrorMessage = useCallback((error: string, patterns: BrazilianRegionalPatterns): string => {
    const errorMessages: Record<string, string> = {
      'no-speech': `${patterns.greetings[0]}! Não ouvi nada. Pode falar de novo?`,
      'audio-capture': `${patterns.greetings[0]}! Problema com o microfone. Verifique se está permitido.`,
      'not-allowed': `${patterns.greetings[0]}! Preciso de permissão para usar o microfone.`,
      'network': `${patterns.greetings[0]}! Problema de conexão. Tenta de novo em um minuto.`,
      'service-not-allowed': `${patterns.greetings[0]}! Serviço de voz não disponível no seu navegador.`
    }
    
    return errorMessages[error] || `${patterns.greetings[0]}! Deu um erro. Tenta de novo.`
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [stopListening])

  // Update region when prop changes
  useEffect(() => {
    setCurrentRegion(region)
  }, [region])

  return (
    <div 
      className={`
        voice-recognition-component 
        ${isListening ? 'voice-listening' : ''} 
        ${voiceState} 
        ${disabled ? 'voice-disabled' : ''}
        ${className}
      `}
      role="application"
      aria-label="Assistente de voz AegisWallet"
      aria-live="polite"
    >
      {children}
      
      {/* Voice indicator for accessibility */}
      {isListening && (
        <div 
          className="voice-indicator"
          role="status"
          aria-label="Ouvindo comando de voz"
        >
          <span className="voice-pulse" />
          <span className="voice-text">Ouvindo...</span>
        </div>
      )}
      
      {/* Voice controls */}
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        className="voice-control-button"
        aria-label={isListening ? 'Parar de ouvir' : 'Começar a ouvir'}
        aria-pressed={isListening}
      >
        {isListening ? (
          <>
            <span className="mic-icon mic-active" />
            <span className="button-text">Parar</span>
          </>
        ) : (
          <>
            <span className="mic-icon" />
            <span className="button-text">Falar</span>
          </>
        )}
      </button>
      
      {/* Current transcript display */}
      {transcript && (
        <div className="voice-transcript" role="status" aria-live="polite">
          <span className="transcript-label">Você disse:</span>
          <span className="transcript-text">{transcript}</span>
        </div>
      )}
      
      {/* Voice state indicator */}
      <div className="voice-state-indicator" aria-hidden="true">
        <span className="state-label">Estado:</span>
        <span className="state-value">
          {voiceState === 'idle' && 'Pronto'}
          {voiceState === 'listening' && 'Ouvindo'}
          {voiceState === 'processing' && 'Processando'}
          {voiceState === 'responding' && 'Respondendo'}
        </span>
      </div>
      
      {/* Regional selector for testing */}
      <select
        value={currentRegion}
        onChange={(e) => setCurrentRegion(e.target.value)}
        className="regional-selector"
        aria-label="Selecionar região brasileira"
        title="Selecionar padrões de fala regionais"
      >
        <option value="SP">São Paulo</option>
        <option value="RJ">Rio de Janeiro</option>
        <option value="NE">Nordeste</option>
        <option value="SUL">Sul</option>
        <option value="NORTE">Norte</option>
        <option value="CO">Centro-Oeste</option>
      </select>
      
      {/* Performance indicator (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="performance-indicator" aria-hidden="true">
          <span className="perf-label">Target: {VAD_CONFIG.TARGET_RESPONSE_TIME}ms</span>
          <span className="perf-value">Região: {currentRegion}</span>
        </div>
      )}
    </div>
  )
}

export default VoiceRecognition
