"use client"

import type React from "react"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Mic,
  MessageSquare,
  ShoppingBag,
  ChevronDown,
  MapPin,
  Mail,
  Calendar,
  User,
  RefreshCw,
  Wifi,
  WifiOff,
  Phone,
  Camera,
  Image,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Tipo para conversaciones
interface Conversation {
  id: string
  clientName: string
  client_name?: string
  lastMessage: string
  last_message?: string
  timestamp: string
  unread: number
  status: string
  canal: string
  avatar?: string
  clientType: string
  client_type?: string
  interest?: string
  phone?: string
}

// Estados del CRM (config sin counts, los conteos se calculan dinámicamente)
const ESTADOS_CONFIG = [
  { id: "todas", label: "Todas", color: "bg-zinc-100 text-zinc-700" },
  { id: "por-contestar", label: "Por Contestar", color: "bg-blue-100 text-blue-700" },
  { id: "pendiente-datos", label: "Pendiente Datos", color: "bg-yellow-100 text-yellow-700" },
  { id: "por-confirmar", label: "Por Confirmar", color: "bg-purple-100 text-purple-700" },
  { id: "pendiente-guia", label: "Pendiente Guía", color: "bg-orange-100 text-orange-700" },
  { id: "pedido-completo", label: "Pedido Completo", color: "bg-green-100 text-green-700" },
  { id: "devolucion", label: "Devolución", color: "bg-red-100 text-red-700" },
]

// Canales de comunicación
const CANALES = [
  { id: "whatsapp", label: "WhatsApp", icon: "💬", color: "bg-green-500" },
  { id: "instagram", label: "Instagram", icon: "📷", color: "bg-pink-500" },
  { id: "messenger", label: "Messenger", icon: "💬", color: "bg-blue-500" },
  { id: "web", label: "Web", icon: "🌐", color: "bg-zinc-500" },
  { id: "telefono", label: "Teléfono", icon: "📞", color: "bg-amber-500" },
]

// Datos mock de conversaciones
const MOCK_CONVERSATIONS = [
  {
    id: "1",
    clientName: "María González",
    lastMessage: "Hola, quiero información sobre balinería",
    timestamp: "10:30 AM",
    unread: 2,
    status: "por-contestar",
    canal: "whatsapp",
    avatar: "/diverse-woman-portrait.png",
    clientType: "Nuevo",
    interest: "Balinería",
  },
  {
    id: "2",
    clientName: "Carlos Ramírez",
    lastMessage: "¿Cuándo llega mi pedido?",
    timestamp: "9:45 AM",
    unread: 0,
    status: "pendiente-guía",
    canal: "instagram",
    avatar: "/man.jpg",
    clientType: "Recurrente",
    interest: "Joyería",
  },
  {
    id: "3",
    clientName: "Ana Martínez",
    lastMessage: "Perfecto, confirmo la compra",
    timestamp: "Ayer",
    unread: 0,
    status: "por-confirmar",
    canal: "web",
    avatar: "/woman-2.jpg",
    clientType: "Nuevo",
    interest: "Balinería",
  },
  {
    id: "4",
    clientName: "Luis Hernández",
    lastMessage: "¿Tienen disponible en talla M?",
    timestamp: "Ayer",
    unread: 1,
    status: "por-contestar",
    canal: "messenger",
    avatar: "/man-2.jpg",
    clientType: "Nuevo",
    interest: "Joyería",
  },
  {
    id: "5",
    clientName: "Patricia Silva",
    lastMessage: "Gracias por la atención",
    timestamp: "2 días",
    unread: 0,
    status: "pedido-completo",
    canal: "whatsapp",
    avatar: "/woman-3.jpg",
    clientType: "Recurrente",
    interest: "Balinería",
  },
  {
    id: "6",
    clientName: "Roberto Díaz",
    lastMessage: "¿Cuándo tienen nuevos diseños?",
    timestamp: "2 días",
    unread: 0,
    status: "pendiente-datos",
    canal: "whatsapp",
    avatar: "/man.jpg",
    clientType: "Nuevo",
    interest: "Joyería",
  },
  {
    id: "7",
    clientName: "Laura Pérez",
    lastMessage: "Me encantó el collar que vi",
    timestamp: "3 días",
    unread: 1,
    status: "por-contestar",
    canal: "instagram",
    avatar: "/woman-2.jpg",
    clientType: "Nuevo",
    interest: "Joyería",
  },
  {
    id: "8",
    clientName: "Diego Torres",
    lastMessage: "Necesito confirmar mi dirección",
    timestamp: "3 días",
    unread: 0,
    status: "pendiente-datos",
    canal: "messenger",
    avatar: "/man-2.jpg",
    clientType: "Recurrente",
    interest: "Balinería",
  },
  {
    id: "9",
    clientName: "Sofía Ruiz",
    lastMessage: "¿Hacen envíos internacionales?",
    timestamp: "4 días",
    unread: 0,
    status: "por-confirmar",
    canal: "web",
    avatar: "/woman-3.jpg",
    clientType: "Nuevo",
    interest: "Balinería",
  },
  {
    id: "10",
    clientName: "Miguel Ángel Castro",
    lastMessage: "Excelente servicio, muchas gracias",
    timestamp: "5 días",
    unread: 0,
    status: "pedido-completo",
    canal: "whatsapp",
    avatar: "/business-agent.png",
    clientType: "Recurrente",
    interest: "Joyería",
  },
]

// Mensajes mock
const MOCK_MESSAGES = [
  {
    id: "1",
    sender: "client",
    content: "Hola, quiero información sobre balinería",
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // Hace 15 minutos
    avatar: "/diverse-woman-portrait.png",
  },
  {
    id: "2",
    sender: "agent",
    content:
      "¡Hola María! Claro, con gusto te ayudo. Tenemos una hermosa colección de balinería disponible. ¿Qué tipo de pieza estás buscando?",
    timestamp: new Date(Date.now() - 14 * 60 * 1000), // Hace 14 minutos
    avatar: "/business-agent.png",
  },
  {
    id: "3",
    sender: "client",
    content: "Me interesan los aretes y collares. ¿Cuáles son los precios?",
    timestamp: new Date(Date.now() - 13 * 60 * 1000), // Hace 13 minutos
    avatar: "/diverse-woman-portrait.png",
  },
  {
    id: "4",
    sender: "client",
    content: "Estoy esperando respuesta...",
    timestamp: new Date(Date.now() - 6 * 60 * 1000), // Hace 6 minutos
    avatar: "/diverse-woman-portrait.png",
  },
]

// Función para calcular tiempo sin responder
function getMinutesSinceLastMessage(timestamp: Date): number {
  const now = new Date()
  const diffMs = now.getTime() - timestamp.getTime()
  return Math.floor(diffMs / (1000 * 60))
}

function formatTime(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? "PM" : "AM"
  const hours12 = hours % 12 || 12
  const minutesStr = minutes.toString().padStart(2, "0")
  return `${hours12}:${minutesStr} ${ampm}`
}

function detectInterest(message: string): "Balinería" | "Joyería" | null {
  const lowerMessage = message.toLowerCase()
  if (lowerMessage.includes("balinería") || lowerMessage.includes("balineria")) {
    return "Balinería"
  }
  if (lowerMessage.includes("joyería") || lowerMessage.includes("joyeria") || lowerMessage.includes("joyas")) {
    return "Joyería"
  }
  return null
}

function getMinutesSinceConversation(conversation: Conversation): number {
  // Calcular minutos desde el timestamp
  if (conversation.status !== "por-contestar") {
    return 0
  }

  try {
    const timestamp = new Date(conversation.timestamp)
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    return Math.floor(diffMs / (1000 * 60))
  } catch {
    return 0
  }
}

// Normalizar conversación de la API a formato del componente
function normalizeConversation(conv: any): Conversation {
  return {
    id: conv.id,
    clientName: conv.client_name || conv.clientName || 'Cliente',
    lastMessage: conv.last_message || conv.lastMessage || '',
    timestamp: conv.timestamp || new Date().toISOString(),
    unread: conv.unread || 0,
    status: conv.status || 'por-contestar',
    canal: conv.canal || 'whatsapp',
    avatar: conv.avatar,
    clientType: conv.client_type || conv.clientType || 'Nuevo',
    interest: conv.interest,
    phone: conv.phone,
  }
}

export default function CRMPage() {
  const [selectedEstado, setSelectedEstado] = useState("todas")
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [activeTab, setActiveTab] = useState<"reply" | "note" | "schedule">("reply")

  // Estados para datos reales
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Estados para secciones expandibles
  const [expandedSections, setExpandedSections] = useState({
    contactInfo: false,
    vipLists: false,
    history: false,
  })

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [fileCaption, setFileCaption] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cargar conversaciones de la API
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/conversations')
      const data = await res.json()

      if (data.ok && data.conversations && data.conversations.length > 0) {
        // Tenemos datos reales de la base de datos
        const normalized = data.conversations.map(normalizeConversation)
        setConversations(normalized)
        setIsConnected(true)
      } else {
        // Sin datos reales, usar mock como fallback
        setConversations(MOCK_CONVERSATIONS.map(normalizeConversation))
        setIsConnected(false)
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading conversations:', error)
      // En caso de error, usar datos mock
      setConversations(MOCK_CONVERSATIONS.map(normalizeConversation))
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Sincronizar chats de WhatsApp
  const syncWhatsAppChats = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/crm/sync', { method: 'POST' })
      const data = await res.json()

      if (data.ok) {
        console.log('✅ Sincronización completada:', data.message)
        // Recargar conversaciones
        await loadConversations()
      } else {
        console.error('❌ Error sincronizando:', data.error)
      }
    } catch (error) {
      console.error('Error syncing:', error)
    } finally {
      setLoading(false)
    }
  }, [loadConversations])

  // Cargar datos al montar y cada 30 segundos
  useEffect(() => {
    loadConversations()

    const interval = setInterval(loadConversations, 30000)
    return () => clearInterval(interval)
  }, [loadConversations])

  // Cargar mensajes cuando se selecciona una conversación
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setLoadingMessages(true)
      const res = await fetch(`/api/crm/messages?conversationId=${conversationId}`)
      const data = await res.json()

      if (data.ok && data.messages) {
        setMessages(data.messages.map((m: any) => ({
          id: m.id,
          sender: m.sender === 'client' ? 'client' : 'agent',
          content: m.content,
          timestamp: new Date(m.timestamp),
          avatar: m.sender === 'client' ? '/diverse-woman-portrait.png' : '/business-agent.png',
        })))
      } else {
        // Si no hay mensajes, usar mock
        setMessages(MOCK_MESSAGES)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages(MOCK_MESSAGES)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  // Cargar mensajes cuando cambia la conversación seleccionada
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
    } else {
      setMessages([])
    }
  }, [selectedConversation, loadMessages])

  // Scroll al final de los mensajes cuando se agregan nuevos
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-menu-trigger]') && !target.closest('[data-menu-content]')) {
        setShowAttachmentMenu(false)
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const matchesEstado = selectedEstado === "todas" || conv.status === selectedEstado
      const matchesSearch =
        searchQuery === "" ||
        conv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesEstado && matchesSearch
    })
  }, [selectedEstado, searchQuery, conversations])

  // Compute counts per estado from conversations (so 'devolucion' shows correctly)
  const estados = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of ESTADOS_CONFIG) counts[s.id] = 0
    counts['todas'] = conversations.length
    for (const c of conversations) {
      if (counts[c.status] === undefined) counts[c.status] = 0
      counts[c.status] = (counts[c.status] || 0) + 1
    }
    return ESTADOS_CONFIG.map((s) => ({ ...s, count: counts[s.id] || 0 }))
  }, [conversations])

  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversation),
    [selectedConversation, conversations],
  )

  const currentCanal = useMemo(() => CANALES.find((c) => c.id === currentConversation?.canal), [currentConversation])

  const lastClientMessage = useMemo(() => [...messages].reverse().find((m) => m.sender === "client"), [messages])

  const minutesSinceLastMessage = lastClientMessage ? getMinutesSinceLastMessage(lastClientMessage.timestamp) : 0

  const insertEmoji = useCallback((emoji: string) => {
    setMessageInput((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }, [])

  const handleAttachment = useCallback(() => {
    setShowAttachmentMenu(prev => !prev)
    setShowEmojiPicker(false)
  }, [])

  // Estado para envío de mensajes
  const [sendingMessage, setSendingMessage] = useState(false)

  // Función para enviar mensaje de texto
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedConversation || !currentConversation) return

    const messageToSend = messageInput.trim()
    setMessageInput("")
    setSendingMessage(true)

    try {
      const res = await fetch('/api/crm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation,
          phone: currentConversation.phone,
          message: messageToSend,
          type: 'text',
        }),
      })

      const data = await res.json()

      if (data.ok) {
        // Agregar mensaje a la lista local inmediatamente
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'agent',
          content: messageToSend,
          timestamp: new Date(),
          avatar: '/business-agent.png',
        }])

        // Recargar mensajes para sincronizar
        setTimeout(() => loadMessages(selectedConversation), 1000)
      } else {
        alert('Error enviando mensaje: ' + (data.error || 'Error desconocido'))
        setMessageInput(messageToSend) // Restaurar mensaje
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      alert('Error de conexión al enviar mensaje')
      setMessageInput(messageToSend)
    } finally {
      setSendingMessage(false)
    }
  }, [messageInput, selectedConversation, currentConversation, loadMessages])

  // Función para enviar archivo (imagen, video, documento)
  const handleSendFile = useCallback(async (file: File, caption?: string) => {
    if (!selectedConversation || !currentConversation) {
      alert('Selecciona una conversación primero')
      return
    }

    // Validar tamaño
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 10MB.')
      return
    }

    setSendingMessage(true)

    try {
      // Determinar tipo de archivo
      let type = 'document'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'
      else if (file.type.startsWith('audio/')) type = 'audio'

      // Enviar archivo directamente usando el nuevo endpoint
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversationId', selectedConversation)
      if (currentConversation.phone) {
        formData.append('phone', currentConversation.phone)
      }
      if (caption) {
        formData.append('caption', caption)
      }

      console.log('📤 Enviando archivo:', file.name, file.type, file.size, 'bytes')

      const res = await fetch('/api/crm/send-file', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      console.log('📤 Respuesta:', data)

      if (data.ok) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'agent',
          content: caption || `[${type}: ${file.name}]`,
          timestamp: new Date(),
          avatar: '/business-agent.png',
          mediaType: type,
        }])
        setTimeout(() => loadMessages(selectedConversation), 1000)
      } else {
        alert('Error enviando archivo: ' + (data.error || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error enviando archivo:', error)
      alert('Error de conexión. Verifica tu internet e intenta de nuevo.')
    } finally {
      setSendingMessage(false)
    }
  }, [selectedConversation, currentConversation, loadMessages])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setPendingFile(files[0])
      setFileCaption("")
      setShowAttachmentMenu(false)
    }
    // Limpiar el input para permitir seleccionar el mismo archivo
    e.target.value = ""
  }, [])

  // Función para cancelar el archivo pendiente
  const cancelPendingFile = useCallback(() => {
    setPendingFile(null)
    setFileCaption("")
  }, [])

  // Función para enviar el archivo pendiente con su descripción
  const sendPendingFile = useCallback(async () => {
    if (pendingFile) {
      await handleSendFile(pendingFile, fileCaption)
      setPendingFile(null)
      setFileCaption("")
    }
  }, [pendingFile, fileCaption, handleSendFile])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Detectar el mejor formato de audio soportado
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      const audioChunks: Blob[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())

        if (audioChunks.length === 0) {
          alert('No se grabó audio. Intenta de nuevo.')
          return
        }

        const audioBlob = new Blob(audioChunks, { type: mimeType })
        console.log('🎤 Audio grabado:', audioBlob.size, 'bytes, tipo:', mimeType)

        // Enviar nota de voz
        if (selectedConversation && currentConversation) {
          setSendingMessage(true)
          try {
            // Determinar extensión del archivo
            const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : 'mp4'

            // Crear archivo de audio y enviar directamente
            const audioFile = new File([audioBlob], `nota-voz-${Date.now()}.${extension}`, { type: mimeType })

            const formData = new FormData()
            formData.append('file', audioFile)
            formData.append('conversationId', selectedConversation)
            if (currentConversation.phone) {
              formData.append('phone', currentConversation.phone)
            }

            console.log('📤 Enviando audio:', audioFile.name, audioFile.size, 'bytes')

            const res = await fetch('/api/crm/send-file', {
              method: 'POST',
              body: formData,
            })

            const data = await res.json()
            console.log('📤 Respuesta:', data)

            if (data.ok) {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'agent',
                content: '[Nota de voz]',
                timestamp: new Date(),
                avatar: '/business-agent.png',
              }])
              setTimeout(() => loadMessages(selectedConversation), 1000)
            } else {
              alert('Error enviando nota de voz: ' + (data.error || 'Error desconocido'))
            }
          } catch (error) {
            console.error('Error enviando nota de voz:', error)
            alert('Error al enviar nota de voz')
          } finally {
            setSendingMessage(false)
          }
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      alert("No se pudo acceder al micrófono. Por favor, verifica los permisos.")
    }
  }, [selectedConversation, currentConversation, loadMessages])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording])

  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker((prev) => !prev)
  }, [])

  const commonEmojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😅",
    "😂",
    "🙂",
    "😉",
    "😊",
    "😍",
    "😘",
    "😋",
    "😎",
    "🤔",
    "😐",
    "😑",
    "😏",
    "🙄",
    "😬",
    "😌",
    "😔",
    "😴",
    "😷",
    "🤒",
    "🤕",
    "🥵",
    "🥶",
    "😵",
    "🤯",
    "😕",
    "😟",
    "🙁",
    "😮",
    "😲",
    "😳",
    "😢",
    "😭",
    "😱",
    "😤",
    "😡",
    "👍",
    "👎",
    "👏",
    "🙌",
    "🙏",
    "✌️",
    "👌",
    "👋",
    "💪",
    "❤️",
    "💛",
    "💚",
    "💙",
    "💜",
    "🔥",
    "✨",
    "⭐",
    "🌟",
  ]

  return (
    <div className="flex h-screen bg-zinc-50">
      <Sidebar />

      <div className="flex flex-1 overflow-hidden">
        {/* Panel Izquierdo - Lista de Conversaciones */}
        <div className="flex w-80 flex-col border-r border-zinc-200 bg-white">
          {/* Header */}
          <div className="border-b border-zinc-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-zinc-900">Inbox</h2>
              <div className="flex items-center gap-2">
                {/* Indicador de conexión */}
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                  isConnected
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                )}>
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      <span>En vivo</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" />
                      <span>Demo</span>
                    </>
                  )}
                </div>
                {/* Botón refrescar */}
                <button
                  onClick={loadConversations}
                  disabled={loading}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors disabled:opacity-50"
                  title="Actualizar conversaciones"
                >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </button>
                {/* Botón sincronizar WhatsApp */}
                {!isConnected && (
                  <button
                    onClick={syncWhatsAppChats}
                    disabled={loading}
                    className="px-2 py-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium transition-colors disabled:opacity-50"
                    title="Sincronizar chats de WhatsApp"
                  >
                    Sync
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Estados */}
          <div className="border-b border-zinc-200 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Estados</p>
            <div className="space-y-1">
              {estados.map((estado) => (
                <button
                  key={estado.id}
                  onClick={() => setSelectedEstado(estado.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium",
                    selectedEstado === estado.id ? "bg-amber-50 text-amber-900" : "text-zinc-700 hover:bg-zinc-50",
                  )}
                >
                  <span>{estado.label}</span>
                  <Badge variant="secondary" className={cn("text-xs", estado.color)}>
                    {estado.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Conversaciones */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredConversations.map((conversation) => {
                const canal = CANALES.find((c) => c.id === conversation.canal)
                const estado = estados.find((e) => e.id === conversation.status)
                const minutesSinceMessage = getMinutesSinceConversation(conversation)
                const isUrgent = minutesSinceMessage > 5 && conversation.status === "por-contestar"

                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={cn(
                      "mb-1 flex w-full items-start gap-2 rounded-lg p-2 text-left",
                      selectedConversation === conversation.id ? "bg-amber-50 shadow-sm" : "hover:bg-zinc-50",
                      isUrgent && "border-2 border-red-500 animate-pulse shadow-md",
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{conversation.clientName[0]}</AvatarFallback>
                      </Avatar>
                      {canal && (
                        <div
                          className={cn(
                            "absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white text-[10px]",
                            canal.color,
                          )}
                        >
                          {canal.icon}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden min-w-0">
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-zinc-900 truncate">{conversation.clientName}</p>
                        <span className="text-[11px] text-zinc-500 flex-shrink-0">{conversation.timestamp}</span>
                      </div>
                      <p className="mb-1.5 truncate text-xs text-zinc-600">{conversation.lastMessage}</p>

                      {conversation.status === "por-contestar" && minutesSinceMessage > 0 && (
                        <div
                          className={cn(
                            "mb-1 inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold",
                            minutesSinceMessage > 5
                              ? "bg-red-100 text-red-700 animate-pulse"
                              : "bg-amber-100 text-amber-700",
                          )}
                        >
                          <span>⏱️</span>
                          <span>
                            {minutesSinceMessage} {minutesSinceMessage === 1 ? "minuto" : "minutos"} sin responder
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {estado && (
                          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", estado.color)}>
                            {estado.label}
                          </Badge>
                        )}
                        {conversation.unread > 0 && (
                          <Badge className="bg-amber-500 text-[10px] px-1.5 py-0 text-white">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Panel Central - Chat */}
        <div
          className="flex flex-1 flex-col bg-[#e5ddd5] overflow-hidden min-h-0"
          style={{
            backgroundImage:
              "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pattern_wide_1920x1920-kJIowfHC7yUPTogefHRI2QcjeEGcKc.jpg')",
            backgroundSize: "400px 400px",
            backgroundRepeat: "repeat",
            backgroundPosition: "center",
          }}
        >
          {selectedConversation && currentConversation ? (
            <>
              {/* Header del Chat - Altura fija */}
              <div className="flex-shrink-0 flex items-center justify-between border-b border-zinc-200 bg-[#f0f0f0] p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentConversation.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{currentConversation.clientName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{currentConversation.clientName}</h3>
                    <div className="flex items-center gap-2">
                      {currentCanal && (
                        <span className="text-xs text-zinc-600">
                          {currentCanal.icon} {currentCanal.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Botones de llamada ocultos - WhatsApp Web no soporta llamadas directas */}
                  <Button variant="ghost" size="icon" className="h-9 w-9 active:scale-95">
                    <MoreVertical className="h-5 w-5 text-zinc-600" />
                  </Button>
                </div>
              </div>

              {/* Área de Mensajes - Estilo WhatsApp */}
              <ScrollArea className="flex-1 min-h-0 p-4">
                <div className="space-y-3">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-32">
                      <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => {
                    return (
                      <div
                        key={message.id}
                        className={cn("flex gap-2", message.sender === "agent" ? "justify-end" : "justify-start")}
                      >
                        {message.sender === "client" && (
                          <Avatar className="h-8 w-8 self-end">
                            <AvatarImage src={message.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">C</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[65%] rounded-lg px-3 py-2 shadow-sm",
                            message.sender === "agent" ? "bg-[#dcf8c6] text-zinc-900" : "bg-white text-zinc-900",
                          )}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>

                          <div className="mt-1 flex items-center justify-end gap-1">
                            <span className="text-[11px] text-zinc-500">{formatTime(message.timestamp)}</span>
                            {message.sender === "agent" && <span className="text-xs text-blue-500">✓✓</span>}
                          </div>
                        </div>
                        {message.sender === "agent" && (
                          <Avatar className="h-8 w-8 self-end">
                            <AvatarImage src={message.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">A</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )
                  })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-zinc-400">
                      <MessageSquare className="h-8 w-8 mb-2" />
                      <p className="text-sm">No hay mensajes aún</p>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Vista previa de archivo pendiente (estilo WhatsApp) */}
              {pendingFile && (
                <div className="flex-shrink-0 border-t border-zinc-200 bg-[#f0f0f0] p-4">
                  <div className="flex items-start gap-3">
                    {/* Vista previa del archivo */}
                    <div className="relative flex-shrink-0">
                      {pendingFile.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(pendingFile)}
                          alt="Vista previa"
                          className="h-24 w-24 rounded-lg object-cover border border-zinc-300"
                        />
                      ) : pendingFile.type.startsWith('video/') ? (
                        <div className="h-24 w-24 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-300">
                          <span className="text-3xl">🎬</span>
                        </div>
                      ) : (
                        <div className="h-24 w-24 rounded-lg bg-zinc-200 flex flex-col items-center justify-center border border-zinc-300">
                          <span className="text-3xl">📄</span>
                          <span className="text-[10px] text-zinc-600 mt-1 px-1 truncate max-w-full">
                            {pendingFile.name.split('.').pop()?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {/* Botón cerrar */}
                      <button
                        onClick={cancelPendingFile}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600 shadow-md"
                      >
                        ✕
                      </button>
                    </div>
                    {/* Info y descripción */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{pendingFile.name}</p>
                      <p className="text-xs text-zinc-500 mb-2">
                        {(pendingFile.size / 1024).toFixed(1)} KB
                      </p>
                      <Input
                        placeholder="Añadir descripción (opcional)"
                        value={fileCaption}
                        onChange={(e) => setFileCaption(e.target.value)}
                        className="text-sm bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendPendingFile()
                          }
                        }}
                      />
                    </div>
                    {/* Botón enviar */}
                    <Button
                      onClick={sendPendingFile}
                      disabled={sendingMessage}
                      className="h-10 w-10 rounded-full bg-[#25d366] hover:bg-[#20bd5a] flex-shrink-0"
                    >
                      {sendingMessage ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Tabs y Input - Estilo WhatsApp */}
              <div className="flex-shrink-0 bg-[#f0f0f0] p-3">
                <div className="mb-2 flex gap-4 px-2">
                  <button
                    onClick={() => setActiveTab("reply")}
                    className={cn("text-sm font-medium", activeTab === "reply" ? "text-[#25d366]" : "text-zinc-500")}
                  >
                    Responder
                  </button>
                  <button
                    onClick={() => setActiveTab("note")}
                    className={cn("text-sm font-medium", activeTab === "note" ? "text-[#25d366]" : "text-zinc-500")}
                  >
                    Nota
                  </button>
                  <button
                    onClick={() => setActiveTab("schedule")}
                    className={cn("text-sm font-medium", activeTab === "schedule" ? "text-[#25d366]" : "text-zinc-500")}
                  >
                    Programar
                  </button>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-zinc-600 active:scale-95"
                        onClick={toggleEmojiPicker}
                      >
                        <Smile className="h-5 w-5" />
                      </Button>

                      {showEmojiPicker && (
                        <div className="absolute bottom-12 left-0 z-50 w-72 rounded-lg border border-zinc-200 bg-white p-2 shadow-xl">
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-zinc-900">Emojis</h4>
                            <button
                              className="h-6 w-6 flex items-center justify-center rounded hover:bg-zinc-100 active:scale-95"
                              onClick={toggleEmojiPicker}
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto">
                            {commonEmojis.map((emoji, index) => (
                              <button
                                key={index}
                                onClick={() => insertEmoji(emoji)}
                                className="flex h-9 w-9 items-center justify-center rounded hover:bg-zinc-100 text-xl active:scale-95"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-zinc-600 active:scale-95 relative"
                      onClick={handleAttachment}
                      data-menu-trigger
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>

                    {/* Menú de adjuntos */}
                    {showAttachmentMenu && (
                      <div className="absolute bottom-14 left-12 z-50 w-48 rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden" data-menu-content>
                        <button
                          onClick={() => {
                            imageInputRef.current?.click()
                            setShowAttachmentMenu(false)
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-zinc-50 text-left"
                        >
                          <span className="text-lg">🖼️</span>
                          <span className="text-zinc-700">Fotos y Videos</span>
                        </button>
                        <button
                          onClick={() => {
                            cameraInputRef.current?.click()
                            setShowAttachmentMenu(false)
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-zinc-50 text-left border-t border-zinc-100"
                        >
                          <span className="text-lg">📷</span>
                          <span className="text-zinc-700">Cámara</span>
                        </button>
                        <button
                          onClick={() => {
                            documentInputRef.current?.click()
                            setShowAttachmentMenu(false)
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-zinc-50 text-left border-t border-zinc-100"
                        >
                          <span className="text-lg">📄</span>
                          <span className="text-zinc-700">Documento</span>
                        </button>
                      </div>
                    )}

                    {/* Inputs de archivo ocultos */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,video/*"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*"
                      capture="environment"
                    />
                    <input
                      ref={documentInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx"
                    />

                    <Input
                      placeholder="Escribe un mensaje"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1 rounded-full border-zinc-300 bg-white"
                      disabled={sendingMessage}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />

                    {isRecording ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-600 animate-pulse active:scale-95"
                        onClick={stopRecording}
                      >
                        <div className="flex flex-col items-center">
                          <Mic className="h-5 w-5" />
                          <span className="text-[10px]">{recordingTime}s</span>
                        </div>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-zinc-600 active:scale-95"
                        onClick={startRecording}
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                    )}

                    <Button
                      className="h-9 w-9 rounded-full bg-[#25d366] p-0 hover:bg-[#20bd5a] active:scale-95 disabled:opacity-50"
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !messageInput.trim()}
                    >
                      {sendingMessage ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-white/90 backdrop-blur-sm">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-4 h-16 w-16 text-zinc-300" />
                <h3 className="mb-2 text-lg font-semibold text-zinc-900">Selecciona una conversación</h3>
                <p className="text-sm text-zinc-500">Elige una conversación del panel izquierdo para comenzar</p>
              </div>
            </div>
          )}
        </div>

        {/* Panel Derecho - Detalles del Cliente */}
        {selectedConversation && currentConversation && (
          <div className="w-96 border-l border-zinc-200 bg-white">
            <ScrollArea className="h-full">
              <div className="p-6">
                {/* Info del Cliente */}
                <div className="mb-6 text-center">
                  <Avatar className="mx-auto mb-3 h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={currentConversation.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl">{currentConversation.clientName[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="mb-1 text-xl font-bold text-zinc-900">{currentConversation.clientName}</h3>
                  <p className="mb-3 text-sm text-zinc-500">Cliente {currentConversation.clientType}</p>
                  <div className="flex items-center justify-center gap-2">
                    {currentCanal && (
                      <Badge className={cn("text-xs text-white", currentCanal.color)}>
                        {currentCanal.icon} {currentCanal.label}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Estado Actual */}
                <div className="mb-6 rounded-lg border border-zinc-200 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-zinc-700">Estado Actual</h4>
                  {estados.filter((e) => e.id === currentConversation.status).map((estado) => (
                    <Badge key={estado.id} className={cn("w-full justify-center py-2 text-sm", estado.color)}>
                      {estado.label}
                    </Badge>
                  ))}
                </div>

                {/* Detalles */}
                <div className="mb-6 rounded-lg border border-zinc-200 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-zinc-900">Detalles</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-zinc-500">Interés:</span>
                      <span className="font-medium text-zinc-900">{currentConversation.interest || "—"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-zinc-500">Tipo de cliente:</span>
                      <span className="font-medium text-zinc-900">{currentConversation.clientType}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-zinc-500">Canal:</span>
                      <span className="font-medium text-zinc-900">{currentCanal?.label}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Información de Contacto */}
                  <div className="rounded-lg border border-zinc-200">
                    <button
                      onClick={() => setExpandedSections((prev) => ({ ...prev, contactInfo: !prev.contactInfo }))}
                      className="flex w-full items-center justify-between p-4 text-left hover:bg-zinc-50 active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-zinc-600" />
                        <span className="font-semibold text-zinc-900">Información de Contacto</span>
                      </div>
                      <ChevronDown
                        className={cn("h-4 w-4 text-zinc-600", expandedSections.contactInfo && "rotate-180")}
                      />
                    </button>
                    {expandedSections.contactInfo && (
                      <div className="border-t border-zinc-200 p-4">
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-zinc-500" />
                            <span className="text-zinc-700">maria.gonzalez@email.com</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-zinc-500" />
                            <span className="text-zinc-700">+57 300 123 4567</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-zinc-500" />
                            <span className="text-zinc-700">Bogotá, Colombia</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Historial de Compras */}
                  <div className="rounded-lg border border-zinc-200">
                    <button
                      onClick={() => setExpandedSections((prev) => ({ ...prev, history: !prev.history }))}
                      className="flex w-full items-center justify-between p-4 text-left hover:bg-zinc-50 active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-zinc-600" />
                        <span className="font-semibold text-zinc-900">Historial de Compras</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 text-zinc-600", expandedSections.history && "rotate-180")} />
                    </button>
                    {expandedSections.history && (
                      <div className="border-t border-zinc-200 p-4">
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-700">Vestido Midi Floral</span>
                            <span className="font-medium text-zinc-900">$320.000</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-700">Shorts de Mezclilla</span>
                            <span className="font-medium text-zinc-900">$560.000</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-700">Bolso de Hombro</span>
                            <span className="font-medium text-zinc-900">$200.000</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Listas VIP */}
                  <div className="rounded-lg border border-zinc-200">
                    <button
                      onClick={() => setExpandedSections((prev) => ({ ...prev, vipLists: !prev.vipLists }))}
                      className="flex w-full items-center justify-between p-4 text-left hover:bg-zinc-50 active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-zinc-600" />
                        <span className="font-semibold text-zinc-900">Listas VIP</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 text-zinc-600", expandedSections.vipLists && "rotate-180")} />
                    </button>
                    {expandedSections.vipLists && (
                      <div className="border-t border-zinc-200 p-4">
                        <div className="space-y-2 text-sm">
                          <Badge variant="secondary" className="w-full justify-start">
                            Cliente Frecuente
                          </Badge>
                          <Badge variant="secondary" className="w-full justify-start">
                            Interesado en Vestidos
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cambiar Estado */}
                <div className="mt-6">
                  <h4 className="mb-3 text-sm font-semibold text-zinc-700">Cambiar Estado</h4>
                  <div className="space-y-2">
                    {estados.filter((e) => e.id !== "todas" && e.id !== currentConversation.status).map((estado) => (
                      <Button
                        key={estado.id}
                        variant="outline"
                        className="w-full justify-start text-sm bg-transparent active:scale-[0.99]"
                        size="sm"
                      >
                        {estado.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Notas */}
                <div className="mt-6">
                  <h4 className="mb-3 text-sm font-semibold text-zinc-700">Notas</h4>
                  <Textarea
                    placeholder="Agregar notas sobre este cliente..."
                    className="min-h-32 resize-none text-sm"
                  />
                  <Button className="mt-3 w-full bg-[#25d366] hover:bg-[#20bd5a] active:scale-[0.99]">
                    Guardar Nota
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}
