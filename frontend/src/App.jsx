import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Bot, User, Send, Upload, FileText, Loader2,
  ChevronDown, ChevronUp, Trash2, AlertCircle,
  BookOpen, Sparkles, X, CheckCircle2, RefreshCw,
  Plus, Mic, BrainCircuit, AudioWaveform,
  PanelLeftClose, PanelLeft, Database, BarChart2,
  History, MessageSquare, Clock, PanelRight, PanelRightClose,
  Lightbulb, Compass, ArrowRight, Check,
  Sun, Moon, Copy, ThumbsUp, ThumbsDown, Volume2, VolumeX,
  Globe, RotateCcw, Cpu, ShieldCheck, HeartHandshake, Terminal
} from 'lucide-react'

/* =========================================================
   API helpers
   ========================================================= */

const API = '/api'

async function fetchDocuments() {
  const res = await fetch(`${API}/documents`)
  if (!res.ok) throw new Error('Failed to fetch documents')
  return res.json()
}

async function uploadDocument(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API}/documents/upload`, { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Upload failed')
  return data
}

async function deleteDocument(id) {
  const res = await fetch(`${API}/documents/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.detail || 'Delete failed')
  }
  return res.json()
}

async function askQuestion(question, topK = 5, language = 'English') {
  const res = await fetch(`${API}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, top_k: topK, language }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to get answer')
  return data
}

/* =========================================================
   Icon helper
   ========================================================= */

function FileIcon({ type }) {
  const colors = {
    pdf: { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb' },
    md: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a' },
    txt: { bg: '#f8fafc', border: '#e2e8f0', icon: '#64748b' },
  }
  const theme = colors[type] || { bg: '#f8fafc', border: '#e2e8f0', icon: '#64748b' }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: theme.bg, border: `1px solid ${theme.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <FileText size={15} color={theme.icon} />
    </div>
  )
}

/* =========================================================
   Sidebar — Optional / Swipeable documents drawer
   ========================================================= */

function Sidebar({ documents, onUpload, onDelete, uploading, isOpen, onClose }) {
  const fileRef = useRef()
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }, [onUpload])

  const totalChunks = documents.reduce((s, d) => s + d.total_chunks, 0)

  return (
    <aside className={`sidebar-drawer ${!isOpen ? 'closed' : ''}`}>
      {/* Brand header */}
      <div style={{
        padding: '18px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff',
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 17, color: '#0f172a', letterSpacing: '-0.3px' }}>
              PolicyLens
            </div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
              KNOWLEDGE VAULT
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          title="Close sidebar"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, borderRadius: 6, color: '#64748b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: '#f8fafc',
      }}>
        <div style={{
          flex: 1, background: '#ffffff', border: '1px solid #e2e8f0',
          borderRadius: 8, padding: '8px 12px',
        }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>DOCUMENTS</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{documents.length}</div>
        </div>
        <div style={{
          flex: 1, background: '#ffffff', border: '1px solid #e2e8f0',
          borderRadius: 8, padding: '8px 12px',
        }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>CHUNKS</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#2563eb' }}>{totalChunks}</div>
        </div>
      </div>

      {/* Upload button / dropzone */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          style={{
            width: '100%',
            padding: '14px 12px',
            background: dragOver ? '#eff6ff' : '#f8fafc',
            border: `1.5px dashed ${dragOver ? '#2563eb' : '#cbd5e1'}`,
            borderRadius: 10,
            cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 6,
            transition: 'all 150ms ease',
          }}
          onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = '#2563eb' }}
          onMouseLeave={e => { if (!uploading && !dragOver) e.currentTarget.style.borderColor = '#cbd5e1' }}
        >
          {uploading ? (
            <Loader2 size={18} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Upload size={18} color="#2563eb" />
          )}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
            {uploading ? 'Indexing Document…' : 'Upload Document'}
          </div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>
            .pdf, .txt, or .md (max 10MB)
          </div>
        </button>
        <input
          ref={fileRef} type="file" accept=".txt,.pdf,.md"
          style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files[0]) { onUpload(e.target.files[0]); e.target.value = '' } }}
        />
      </div>

      {/* Document list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        <div style={{
          fontSize: 10.5, fontWeight: 700, color: '#94a3b8',
          letterSpacing: '0.6px', textTransform: 'uppercase',
          padding: '4px 6px 10px',
        }}>
          INDEXED DOCUMENTS
        </div>
        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 12 }}>
            No documents indexed yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 11, color: '#94a3b8',
        background: '#ffffff',
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
        <span>FAISS · MiniLM · Groq LLM</span>
      </div>
    </aside>
  )
}

function DocumentCard({ doc, onDelete }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        background: hovered ? '#f1f5f9' : '#ffffff',
        border: '1px solid',
        borderColor: hovered ? '#cbd5e1' : '#f1f5f9',
        display: 'flex', alignItems: 'center', gap: 10,
        transition: 'all 150ms ease',
      }}
    >
      <FileIcon type={doc.file_type} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12.5, fontWeight: 600, color: '#0f172a',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {doc.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 10.5, color: '#64748b' }}>
            {doc.total_chunks} chunks
          </span>
          {doc.is_seeded && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              background: '#eff6ff', color: '#2563eb',
              border: '1px solid #bfdbfe',
              padding: '1px 5px', borderRadius: 4,
            }}>
              SAMPLE
            </span>
          )}
        </div>
      </div>
      {!doc.is_seeded && (
        <button
          onClick={() => onDelete(doc.id, doc.name)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, borderRadius: 4,
            color: hovered ? '#ef4444' : 'transparent',
            display: 'flex', alignItems: 'center',
          }}
          title="Delete document"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

/* =========================================================
   Right-Side Chat History Drawer Component
   ========================================================= */

function formatSessionDate(isoDate) {
  if (!isoDate) return 'Just now'
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (diffHours < 48) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function HistorySidebar({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAllSessions,
}) {
  return (
    <aside className={`history-drawer ${!isOpen ? 'closed' : ''}`}>
      {/* Brand & Title Header */}
      <div style={{
        padding: '18px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--primary-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 8px var(--primary-glow)',
          }}>
            <History size={16} />
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--text-heading)', letterSpacing: '-0.3px' }}>
              Chat History
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>
              {sessions.length} SAVED {sessions.length === 1 ? 'CONVERSATION' : 'CONVERSATIONS'}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          title="Close chat history"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, borderRadius: 6, color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* New Chat Primary Action Button */}
      <div style={{ padding: '14px 16px 8px', flexShrink: 0 }}>
        <button
          onClick={() => {
            onNewChat()
            if (window.innerWidth < 768) onClose()
          }}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            background: 'var(--primary-gradient)',
            border: 'none',
            color: '#ffffff',
            fontFamily: "'Outfit', var(--font-sans)",
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 2px 10px var(--primary-glow)',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Saved Sessions Scroll List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {sessions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 16px',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}>
            <MessageSquare size={32} color="var(--border-pill)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4 }}>No chat history yet</p>
            <p style={{ fontSize: 12, lineHeight: 1.5 }}>
              Ask a question to start a conversation. It will automatically be saved here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sessions.map((session) => {
              const isActive = session.id === currentSessionId
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id)
                    if (window.innerWidth < 768) onClose()
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: isActive ? 'var(--primary-light)' : 'var(--bg-card-solid)',
                    border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: isActive ? 'var(--primary)' : 'var(--bg-card-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}>
                      <MessageSquare size={14} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--primary)' : 'var(--text-heading)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {session.title || 'Untitled Chat'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Clock size={10} />
                        <span>{formatSessionDate(session.createdAt)}</span>
                        <span>•</span>
                        <span>{session.messages?.length || 0} msgs</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete individual session */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                    title="Delete session"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 4,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.7,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {sessions.length > 0 && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card-solid)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Saved locally
          </span>
          <button
            onClick={onClearAllSessions}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: '#ef4444',
              fontWeight: 500,
              padding: '4px 6px',
              borderRadius: 4,
            }}
          >
            Clear All
          </button>
        </div>
      )}
    </aside>
  )
}


/* =========================================================
   Source Citations Panel
   ========================================================= */


/* =========================================================
   Supported Languages & Bento Handbook Data
   ========================================================= */

const SUPPORTED_LANGUAGES = [
  { code: 'EN', name: 'English', flag: '🇺🇸' },
  { code: 'HI', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'FR', name: 'French', flag: '🇫🇷' },
  { code: 'DE', name: 'German', flag: '🇩🇪' },
  { code: 'JA', name: 'Japanese', flag: '🇯🇵' },
]

const DEFAULT_POLICIES = [
  {
    id: 'it_sop',
    title: 'IT Security & Ops SOP',
    category: 'Security & Access',
    icon: ShieldCheck,
    badge: '18 Chunks • ISO-27001',
    color: '#06b6d4',
    desc: 'Password standards, MFA setup, remote laptop access, VPN, and incident escalation protocols.',
    prompt: 'What are the password, MFA, and VPN requirements in the IT Security SOP?'
  },
  {
    id: 'hr_policy',
    title: 'HR Policy Manual',
    category: 'HR & Benefits',
    icon: HeartHandshake,
    badge: '14 Chunks • Active',
    color: '#6366f1',
    desc: 'Annual and sick leave rules, medical coverage, remote work policies, and code of conduct.',
    prompt: 'What is our company policy regarding paid time off (PTO), sick leave, and medical leave documentation?'
  },
  {
    id: 'onboarding',
    title: 'Employee Onboarding',
    category: 'People Ops',
    icon: Compass,
    badge: '9 Chunks • Onboarding',
    color: '#10b981',
    desc: 'New hire roadmap covering Day 1 activities, compliance courses, and 30-60-90 day milestones.',
    prompt: 'What are the key goals and deliverables for a new hire during their first 30, 60, and 90 days?'
  },
  {
    id: 'engineering',
    title: 'Engineering Handbook',
    category: 'Product & Tech',
    icon: Terminal,
    badge: '22 Chunks • Production',
    color: '#8b5cf6',
    desc: 'Production code review rules, CI/CD pipeline triggers, deployment freeze windows, and on-call.',
    prompt: 'What are the deployment freeze windows and on-call escalation rules in the Engineering Handbook?'
  }
]

function BentoHandbookSection({ onSelectPrompt }) {
  return (
    <div className="bento-handbook-container">
      <div className="bento-handbook-header">
        <div className="bento-header-left">
          <div className="bento-sparkle-icon">
            <Sparkles size={16} />
          </div>
          <span className="bento-header-title">Enterprise Policy Knowledge Base</span>
        </div>
        <span className="bento-header-badge">4 Verified Playbooks</span>
      </div>
      <div className="bento-cards-grid">
        {DEFAULT_POLICIES.map((policy) => {
          const IconComponent = policy.icon
          return (
            <div
              key={policy.id}
              className="bento-card"
              onClick={() => onSelectPrompt(policy.prompt)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectPrompt(policy.prompt)}
            >
              <div className="bento-card-top">
                <div className="bento-card-icon" style={{ color: policy.color, backgroundColor: `${policy.color}15` }}>
                  <IconComponent size={20} />
                </div>
                <span className="bento-badge" style={{ borderColor: `${policy.color}40`, color: policy.color }}>
                  {policy.badge}
                </span>
              </div>
              <h3 className="bento-card-title">{policy.title}</h3>
              <p className="bento-card-desc">{policy.desc}</p>
              <div className="bento-card-footer">
                <span className="bento-category">{policy.category}</span>
                <span className="bento-ask-action">
                  Ask Policy <ArrowRight size={13} />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SourcePanel({ sources }) {
  const [open, setOpen] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState(null)

  if (!sources || sources.length === 0) return null

  return (
    <div style={{
      marginTop: 10,
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      overflow: 'hidden',
      background: '#ffffff',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: '#f8fafc', border: 'none',
          cursor: 'pointer', padding: '9px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
          color: '#475569',
        }}
      >
        <BookOpen size={14} color="#2563eb" />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', flex: 1, textAlign: 'left' }}>
          {sources.length} Source{sources.length !== 1 ? 's' : ''} Referenced
        </span>
        {open ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #e2e8f0' }}>
          {sources.map((src, i) => (
            <div key={i} style={{ borderBottom: i < sources.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <button
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                style={{
                  width: '100%', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '8px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#eff6ff', color: '#2563eb',
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {src.document_name}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#64748b', display: 'flex', gap: 6, marginTop: 1 }}>
                    <span>§ {src.section_title}</span>
                    <span>•</span>
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>{Math.round(src.relevance_score * 100)}% match</span>
                  </div>
                </div>
                {expandedIdx === i ? <ChevronUp size={12} color="#94a3b8" /> : <ChevronDown size={12} color="#94a3b8" />}
              </button>

              {expandedIdx === i && (
                <div style={{ padding: '10px 14px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: 11.5, lineHeight: 1.6, color: '#475569', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                    {src.text}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   Message Bubble
   ========================================================= */

function MessageBubble({ msg, onToast }) {
  const isUser = msg.role === 'user'
  const isError = msg.role === 'error'
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const handleCopy = () => {
    if (!msg.content) return
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    if (onToast) onToast('Response copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      if (onToast) onToast('Speech synthesis not supported on this browser', 'error')
      return
    }
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(msg.content)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const handleFeedback = (type) => {
    setFeedback(type)
    if (onToast) {
      onToast(type === 'up' ? 'Helpful feedback recorded!' : 'Feedback noted for future retrieval.')
    }
  }

  if (isUser) {
    return (
      <div className="fade-in" style={{
        display: 'flex', justifyContent: 'flex-end',
        alignItems: 'flex-start', gap: 10, width: '100%',
      }}>
        <div className="user-message-bubble">
          <p style={{ fontSize: 14.5, lineHeight: 1.55, fontWeight: 500, margin: 0, whiteSpace: 'pre-wrap' }}>
            {msg.content}
          </p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="fade-in" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', width: '100%' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <AlertCircle size={16} color="#ef4444" />
        </div>
        <div style={{
          flex: 1, background: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '4px 16px 16px 16px', padding: '14px 18px',
        }}>
          <p style={{ fontSize: 14, color: '#ef4444', margin: 0 }}>{msg.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in assistant-bubble-wrapper" style={{
      display: 'flex', gap: 14, alignItems: 'flex-start', width: '100%',
    }}>
      <div className="bot-avatar-badge">
        <Bot size={17} color="var(--primary)" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.02em' }}>
            PolicyLens AI
          </span>
          <span className="assistant-model-pill">
            <Cpu size={11} /> Llama-3.3-70B
          </span>
          {msg.sources && msg.sources.length > 0 && (
            <span className="assistant-sources-pill">
              <ShieldCheck size={11} /> {msg.sources.length} Verified Sources
            </span>
          )}
        </div>

        <div className="assistant-bubble-card">
          <div className="prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>

          {/* Action Toolbar */}
          <div className="assistant-action-bar">
            <button
              className={`bubble-action-btn ${copied ? 'active-success' : ''}`}
              onClick={handleCopy}
              title="Copy answer to clipboard"
            >
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              className={`bubble-action-btn ${speaking ? 'active-playing' : ''}`}
              onClick={handleSpeak}
              title={speaking ? "Stop reading" : "Read aloud (TTS)"}
            >
              {speaking ? <VolumeX size={13} color="#ef4444" /> : <Volume2 size={13} />}
              <span>{speaking ? 'Stop' : 'Read'}</span>
            </button>

            <div className="action-bar-divider" />

            <button
              className={`bubble-action-btn icon-only ${feedback === 'up' ? 'active-feedback' : ''}`}
              onClick={() => handleFeedback('up')}
              title="Helpful"
            >
              <ThumbsUp size={13} />
            </button>

            <button
              className={`bubble-action-btn icon-only ${feedback === 'down' ? 'active-feedback' : ''}`}
              onClick={() => handleFeedback('down')}
              title="Not helpful"
            >
              <ThumbsDown size={13} />
            </button>
          </div>
        </div>

        {msg.sources && <SourcePanel sources={msg.sources} />}
      </div>
    </div>
  )
}

/* =========================================================
   Typing Indicator
   ========================================================= */

function TypingIndicator() {
  return (
    <div className="fade-in" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: '#eff6ff', border: '1px solid #bfdbfe',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Bot size={17} color="#2563eb" />
      </div>
      <div style={{
        background: '#ffffff', border: '1px solid #e2e8f0',
        borderRadius: 16, padding: '12px 18px',
        display: 'flex', gap: 6, alignItems: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {[0, 150, 300].map((delay) => (
          <div key={delay} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#2563eb',
            animation: `bounce 1.2s ${delay}ms ease-in-out infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

/* =========================================================
   Toast notification
   ========================================================= */

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast) return null

  const isSuccess = toast.type === 'success'
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 1000,
      background: '#ffffff',
      border: `1px solid ${isSuccess ? '#86efac' : '#fca5a5'}`,
      borderRadius: 8, padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: 'var(--shadow-md)',
      maxWidth: 360,
    }}>
      {isSuccess
        ? <CheckCircle2 size={16} color="#16a34a" />
        : <AlertCircle size={16} color="#dc2626" />}
      <span style={{ fontSize: 13, color: '#1e293b', flex: 1, fontWeight: 500 }}>
        {toast.message}
      </span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#94a3b8' }}>
        <X size={14} />
      </button>
    </div>
  )
}

/* =========================================================
   Standing Businessman Robot Component
   ========================================================= */

function BusinessmanRobo({ status, speech, onActionClick }) {
  const isThinking = status === 'thinking'
  const isReply = status === 'reply'

  return (
    <div
      className={`businessman-robo-container ${status}`}
      onClick={onActionClick}
      title="PolicyLens Executive AI Robot - Click to interact"
    >
      {/* Speech Bubble */}
      {speech && (
        <div className="robo-speech-bubble">
          <span>{speech}</span>
          <div className="robo-speech-arrow" />
        </div>
      )}

      {/* Celebration Sparkles when reply arrives */}
      {isReply && (
        <div className="robo-sparkles">
          <span className="sparkle s1">✨</span>
          <span className="sparkle s2">⭐</span>
          <span className="sparkle s3">⚡</span>
        </div>
      )}

      {/* SVG Businessman Robot */}
      <svg
        width="66"
        height="116"
        viewBox="0 0 66 116"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="chromeHead" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="blueTie" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="briefcaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <filter id="eyeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* Floor Drop Shadow */}
        <ellipse cx="33" cy="113" rx="21" ry="3" fill="rgba(15, 23, 42, 0.16)" />

        {/* Shoes */}
        <rect x="22" y="108" width="10" height="5" rx="2.5" fill="#0f172a" />
        <rect x="34" y="108" width="10" height="5" rx="2.5" fill="#0f172a" />

        {/* Trouser Legs */}
        <rect x="23" y="78" width="8" height="31" rx="2" fill="url(#suitGrad)" />
        <rect x="35" y="78" width="8" height="31" rx="2" fill="url(#suitGrad)" />
        {/* Belt */}
        <rect x="22" y="76" width="22" height="3" fill="#0f172a" />
        <rect x="31" y="76" width="4" height="3" fill="#fbbf24" />

        {/* Torso & Suit Jacket */}
        <path d="M18 43 L48 43 L46 77 L20 77 Z" fill="url(#suitGrad)" />

        {/* Crisp White Shirt Collar V */}
        <polygon points="29,43 37,43 33,55" fill="#ffffff" />

        {/* Royal Blue Necktie */}
        <polygon points="32,45 34,45 35,62 33,67 31,62" fill="url(#blueTie)" />
        {/* Tie Gold Clip */}
        <line x1="31.5" y1="55" x2="34.5" y2="55" stroke="#fbbf24" strokeWidth="1" />

        {/* Suit Lapels */}
        <path d="M18 43 L26 61 L24 76 L19 76 Z" fill="#334155" opacity="0.6" />
        <path d="M48 43 L40 61 L42 76 L47 76 Z" fill="#334155" opacity="0.6" />

        {/* Chest Pocket & Stylus */}
        <line x1="21" y1="53" x2="25" y2="53" stroke="#475569" strokeWidth="1" />
        <line x1="22.5" y1="50" x2="22.5" y2="53" stroke="#38bdf8" strokeWidth="1" />

        {/* Left Arm & Briefcase */}
        <g>
          <path d="M46 45 Q53 59 51 71" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="51" cy="73" r="3" fill="#94a3b8" />
          {/* Briefcase */}
          <rect x="46" y="75" width="14" height="11" rx="1.5" fill="url(#briefcaseGrad)" stroke="#475569" strokeWidth="0.6" />
          <rect x="51" y="73" width="4" height="2" rx="0.8" fill="#cbd5e1" />
          <line x1="46" y1="80" x2="60" y2="80" stroke="#64748b" strokeWidth="0.5" />
          <circle cx="53" cy="80" r="1" fill="#38bdf8" />
        </g>

        {/* Right Arm (Articulated Action Arm) */}
        {isReply ? (
          /* Reply Action: Thumbs-up & celebratory gesture */
          <g>
            <path d="M19 45 Q9 37 11 25" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="11" cy="24" r="3.5" fill="#94a3b8" />
            <path d="M11 24 L11 18 L13 18 L13 24 Z" fill="#94a3b8" />
            <circle cx="12" cy="17" r="1.5" fill="#38bdf8" />
          </g>
        ) : isThinking ? (
          /* Thinking Pose: Hand to chin */
          <g>
            <path d="M19 45 Q9 49 22 36" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="22" cy="35" r="3" fill="#94a3b8" />
          </g>
        ) : (
          /* Idle: Relaxed Arm */
          <g>
            <path d="M20 45 Q14 59 15 71" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="15" cy="73" r="3" fill="#94a3b8" />
          </g>
        )}

        {/* Robot Neck */}
        <rect x="30" y="38" width="6" height="6" rx="1.5" fill="#64748b" />
        <line x1="31" y1="40" x2="35" y2="40" stroke="#38bdf8" strokeWidth="0.8" />

        {/* Robot Head */}
        <g>
          {/* Head Base */}
          <rect x="20" y="14" width="26" height="25" rx="7" fill="url(#chromeHead)" stroke="#94a3b8" strokeWidth="1" />
          {/* Executive Cyber-Hair Trim */}
          <path d="M20 19 Q33 12 46 19 L46 16 Q33 11 20 16 Z" fill="#334155" />

          {/* Headset Antenna on Left */}
          <line x1="46" y1="24" x2="51" y2="19" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="51" cy="19" r="2" fill={isReply ? "#fbbf24" : isThinking ? "#38bdf8" : "#22c55e"} />

          {/* Ear piece on Right */}
          <rect x="18" y="23" width="2.5" height="7" rx="1" fill="#475569" />

          {/* Visor Screen */}
          <rect x="23.5" y="22" width="19" height="11" rx="3" fill="#090d16" />

          {/* Visor Eyes / Scanner Display */}
          {isReply ? (
            /* Joyful Happy Eyes: ^^ */
            <g filter="url(#eyeGlow)">
              <path d="M27 28.5 Q29 25 31 28.5" stroke="#00f0ff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <path d="M35 28.5 Q37 25 39 28.5" stroke="#00f0ff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </g>
          ) : isThinking ? (
            /* Scanning Beam */
            <g filter="url(#eyeGlow)">
              <line x1="25" y1="27.5" x2="41" y2="27.5" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1.5" />
              <rect x="30" y="26" width="6" height="3" rx="1.5" fill="#00f0ff" className="robo-scanner-beam" />
            </g>
          ) : (
            /* Idle: Friendly Glowing Cyan Eyes with blink */
            <g filter="url(#eyeGlow)" className="robo-idle-eyes">
              <rect x="26.5" y="25.5" width="4.5" height="4" rx="2" fill="#00f0ff" />
              <rect x="35" y="25.5" width="4.5" height="4" rx="2" fill="#00f0ff" />
            </g>
          )}

          {/* Speaker Grille Mouth */}
          <line x1="30" y1="35" x2="36" y2="35" stroke="#64748b" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  )
}

/* =========================================================
   Think Suggestions Popover Component
   Smartly analyzes user's conversation purpose and recommends
   relevant next steps & questions when clicking 'Think'.
   ========================================================= */

function ThinkSuggestionsPopover({
  isOpen,
  onClose,
  loading,
  data,
  onSelectSuggestion,
  onRefresh,
}) {
  const popoverRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        // Only close if not clicking on the Think button itself
        const thinkBtn = e.target.closest('.pill-think-badge')
        if (!thinkBtn) {
          onClose()
        }
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={popoverRef}
      className="think-popover-container"
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 14px)',
        right: 48,
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #bfdbfe',
        boxShadow: '0 20px 45px -10px rgba(37, 99, 235, 0.22), 0 0 0 1px rgba(191, 219, 254, 0.6)',
        padding: '16px',
        zIndex: 100,
        animation: 'speechPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Decorative arrow pointing to the Think button */}
      <div
        style={{
          position: 'absolute',
          bottom: -7,
          right: 36,
          width: 14,
          height: 14,
          background: '#ffffff',
          borderRight: '1px solid #bfdbfe',
          borderBottom: '1px solid #bfdbfe',
          transform: 'rotate(45deg)',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1px solid #bfdbfe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BrainCircuit size={16} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>Think & Purpose AI</span>
              <span style={{
                fontSize: 10,
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                borderRadius: 9999,
                padding: '1px 6px',
                fontWeight: 600
              }}>
                Smart Suggest
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh suggestions"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#64748b',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#1e293b'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <Loader2 size={24} color="#2563eb" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 500 }}>
            Analyzing conversation & understanding purpose...
          </p>
        </div>
      ) : data ? (
        <>
          {/* Detected Purpose Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            border: '1px solid #bfdbfe',
            borderRadius: 10,
            padding: '9px 12px',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Compass size={13} color="#2563eb" />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#1e40af' }}>
                Detected Purpose
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              {data.detected_purpose || 'Policy Exploration'}
            </div>
            {data.intent_summary && (
              <div style={{ fontSize: 11.5, color: '#475569', marginTop: 3, lineHeight: 1.35 }}>
                {data.intent_summary}
              </div>
            )}
          </div>

          {/* Suggested Next Questions based on purpose */}
          <div style={{ marginBottom: 6 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}>
              <Lightbulb size={12} color="#f59e0b" />
              <span>Recommended For You</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {data.suggestions?.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSuggestion(item.prompt)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#eff6ff'
                    e.currentTarget.style.borderColor = '#93c5fd'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#f8fafc'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
                        {item.title}
                      </span>
                      {item.category && (
                        <span style={{
                          fontSize: 9.5,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: item.category === 'Benefit' ? '#dcfce7' : item.category === 'Procedure' ? '#e0e7ff' : '#fef3c7',
                          color: item.category === 'Benefit' ? '#15803d' : item.category === 'Procedure' ? '#3730a3' : '#b45309',
                          fontWeight: 600,
                        }}>
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.3 }}>
                      {item.prompt}
                    </div>
                  </div>
                  <ArrowRight size={14} color="#94a3b8" style={{ marginTop: 2, flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>

          <div style={{
            fontSize: 10.5,
            color: '#94a3b8',
            textAlign: 'center',
            marginTop: 8,
            borderTop: '1px solid #f1f5f9',
            paddingTop: 6,
          }}>
            Click any suggestion to ask instantly
          </div>
        </>
      ) : null}
    </div>
  )
}

/* =========================================================
   Main App Component
   ========================================================= */



/* =========================================================
   fetchSuggestions Helper
   ========================================================= */

async function fetchSuggestions(messages = [], currentInput = '') {
  // Return tailored policy suggestions based on conversation context
  return {
    detected_purpose: 'Policy Exploration & Operations',
    intent_summary: 'Inquiring about workplace policies, IT security protocols, or benefits.',
    suggestions: [
      { title: 'Leave & Absence', prompt: 'What are the rules for annual, casual, and medical leave in the HR policy?', category: 'HR Policy' },
      { title: 'IT Remote Access & VPN', prompt: 'What are the required steps and security protocols for remote laptop setup and VPN access in the IT SOP?', category: 'IT SOP' },
      { title: 'New Hire 30-60-90 Goals', prompt: 'What are the 30, 60, and 90-day milestones for new hires in the onboarding guide?', category: 'Onboarding' },
      { title: 'Code Review & On-Call', prompt: 'What are the production deployment windows and on-call escalation rules in the Engineering Handbook?', category: 'Engineering' },
    ]
  }
}


export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Left documents drawer
  const [historyOpen, setHistoryOpen] = useState(false) // Right chat history drawer
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('policylens_theme') || 'dark'
    } catch {
      return 'dark'
    }
  })
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [langOpen, setLangOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Toast notification helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  // Toggle Theme handler
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  // Persist theme to document & localStorage
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('policylens_theme', theme)
    } catch (e) {
      console.error('Failed to set theme', e)
    }
  }, [theme])

  // Standing Businessman Robot state
  const [roboStatus, setRoboStatus] = useState('idle') // 'idle' | 'thinking' | 'reply'
  const [roboSpeech, setRoboSpeech] = useState('')
  const replyTimerRef = useRef(null)
  const prevLoadingRef = useRef(false)

  // Chat sessions state with localStorage persistence
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('policylens_chat_sessions')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Current active session ID
  const [currentSessionId, setCurrentSessionId] = useState(() => 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6))

  // Persist sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('policylens_chat_sessions', JSON.stringify(sessions))
    } catch (err) {
      console.error('Failed to save chat sessions', err)
    }
  }, [sessions])

  // Save current conversation messages into the active session
  useEffect(() => {
    if (messages.length === 0) return

    setSessions(prev => {
      const existing = prev.find(s => s.id === currentSessionId)
      if (existing) {
        return prev.map(s => s.id === currentSessionId ? { ...s, messages } : s)
      } else {
        const firstUserMsg = messages.find(m => m.role === 'user')
        const title = firstUserMsg
          ? (firstUserMsg.content.slice(0, 36) + (firstUserMsg.content.length > 36 ? '...' : ''))
          : 'Policy Inquiry'
        const newSession = {
          id: currentSessionId,
          title,
          createdAt: new Date().toISOString(),
          messages,
        }
        return [newSession, ...prev]
      }
    })
  }, [messages, currentSessionId])

  // Load documents
  const loadDocuments = useCallback(async () => {
    try {
      const docs = await fetchDocuments()
      setDocuments(docs)
    } catch (err) {
      showToast('Failed to load documents', 'error')
    }
  }, [showToast])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Send message handler (declared before any callback that uses it)
  const handleSend = useCallback(async (questionOverride) => {
    const question = (questionOverride || input).trim()
    if (!question || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question, id: Date.now() }])
    setLoading(true)

    try {
      const data = await askQuestion(question, 5, selectedLanguage)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        id: Date.now() + 1,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: err.message || 'Something went wrong. Please try again.',
        id: Date.now() + 1,
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, selectedLanguage])

  // Think & Purpose AI suggestions state
  const [thinkOpen, setThinkOpen] = useState(false)
  const [thinkLoading, setThinkLoading] = useState(false)
  const [thinkData, setThinkData] = useState(null)

  // Fetch purpose & suggestions when opening Think
  const handleToggleThink = useCallback(async () => {
    if (thinkOpen) {
      setThinkOpen(false)
      return
    }

    setThinkOpen(true)
    setThinkLoading(true)
    try {
      const data = await fetchSuggestions(messages, input)
      setThinkData(data)
    } catch (err) {
      console.error('Failed to load suggestions:', err)
      setThinkData({
        detected_purpose: 'Policy & Benefits Overview',
        intent_summary: 'Understand company guidelines, benefits, and standard procedures.',
        suggestions: [
          { title: 'Leave & Absence', prompt: 'What are the rules for annual and sick leave?', category: 'Benefit' },
          { title: 'Remote Work Policy', prompt: 'What is the company policy regarding remote work and work from home?', category: 'Procedure' },
          { title: 'Health & Medical Benefits', prompt: 'What health insurance and medical coverage does the company offer?', category: 'Benefit' },
          { title: 'Incident & IT SOP', prompt: 'How are IT security incidents reported and handled?', category: 'Procedure' },
        ]
      })
    } finally {
      setThinkLoading(false)
    }
  }, [thinkOpen, messages, input])

  // When user clicks any suggested question
  const handleSelectSuggestion = useCallback((prompt) => {
    setThinkOpen(false)
    setInput(prompt)
    handleSend(prompt)
  }, [handleSend])

  // Trigger Businessman Robot dynamic actions when reply comes
  useEffect(() => {
    if (loading && !prevLoadingRef.current) {
      setRoboStatus('thinking')
      setRoboSpeech('Analyzing policies... 🔍')
    } else if (!loading && prevLoadingRef.current) {
      setRoboStatus('reply')
      const replyPhrases = [
        'Policy insight ready! 📊✨',
        'Answer verified! 📑💼',
        'Found the details, Boss! 🚀',
        'Grounded in documents! 🎯',
      ]
      setRoboSpeech(replyPhrases[Math.floor(Math.random() * replyPhrases.length)])

      if (replyTimerRef.current) clearTimeout(replyTimerRef.current)
      replyTimerRef.current = setTimeout(() => {
        setRoboStatus('idle')
        setRoboSpeech('')
      }, 5500)
    }
    prevLoadingRef.current = loading
  }, [loading])

  const handleRoboClick = () => {
    if (loading) return
    setRoboStatus('reply')
    const quotes = [
      'At your service! 💼',
      'Compliance check 100%! 🛡️',
      '37 policy chunks indexed! 📂',
      'Ready to assist, Boss! 🫡',
    ]
    setRoboSpeech(quotes[Math.floor(Math.random() * quotes.length)])
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current)
    replyTimerRef.current = setTimeout(() => {
      setRoboStatus('idle')
      setRoboSpeech('')
    }, 4000)
  }

  // Touch gesture swipe handling for both left and right drawers
  const touchStartRef = useRef({ x: 0, y: 0 })
  const handleTouchStart = (e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const handleTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      // Left edge swipe right -> Open Documents drawer
      if (deltaX > 0 && touchStartRef.current.x < 60) {
        setSidebarOpen(true)
      }
      // Swipe left on left drawer -> Close Documents drawer
      else if (deltaX < 0 && sidebarOpen) {
        setSidebarOpen(false)
      }
      // Right edge swipe left -> Open History drawer
      else if (deltaX < 0 && touchStartRef.current.x > window.innerWidth - 60) {
        setHistoryOpen(true)
      }
      // Swipe right on right drawer -> Close History drawer
      else if (deltaX > 0 && historyOpen) {
        setHistoryOpen(false)
      }
    }
  }

  const handleUpload = useCallback(async (file) => {
    setUploading(true)
    try {
      const result = await uploadDocument(file)
      showToast(`"${result.document_name}" indexed successfully`)
      await loadDocuments()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }, [loadDocuments, showToast])

  const handleDelete = useCallback(async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await deleteDocument(id)
      showToast(`"${name}" removed`)
      await loadDocuments()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }, [loadDocuments, showToast])

  const handleNewChat = useCallback(() => {
    const newId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    setCurrentSessionId(newId)
    setMessages([])
    setInput('')
    setThinkOpen(false)
    setThinkData(null)
    setRoboStatus('reply')
    setRoboSpeech('New chat ready! 🚀')
    setTimeout(() => {
      inputRef.current?.focus()
      setRoboStatus('idle')
      setRoboSpeech('')
    }, 2500)
  }, [])

  const handleSelectSession = useCallback((sessionId) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return
    setCurrentSessionId(session.id)
    setMessages(session.messages || [])
    setThinkOpen(false)
    setThinkData(null)
    setRoboStatus('reply')
    setRoboSpeech(`Loaded "${(session.title || 'chat').slice(0, 18)}" 📑`)
    setTimeout(() => {
      setRoboStatus('idle')
      setRoboSpeech('')
    }, 2500)
  }, [sessions])

  const handleDeleteSession = useCallback((sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (currentSessionId === sessionId) {
      const newId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
      setCurrentSessionId(newId)
      setMessages([])
    }
    showToast('Conversation deleted')
  }, [currentSessionId, showToast])

  const handleClearAllSessions = useCallback(() => {
    if (!confirm('Clear all chat history? This cannot be undone.')) return
    setSessions([])
    localStorage.removeItem('policylens_chat_sessions')
    const newId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    setCurrentSessionId(newId)
    setMessages([])
    showToast('All chat history cleared')
  }, [showToast])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop for mobile drawers */}
      {(sidebarOpen || historyOpen) && (
        <div
          className="sidebar-backdrop"
          onClick={() => { setSidebarOpen(false); setHistoryOpen(false) }}
        />
      )}

      {/* Optional Documents / Upload Sidebar */}
      <Sidebar
        documents={documents}
        onUpload={handleUpload}
        onDelete={handleDelete}
        uploading={uploading}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main chat layout */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden', position: 'relative',
      }}>
        {/* Simple Top Header: Document toggle on left, PolicyLens center title, History & Clear on right */}
        <header className="top-navbar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setSidebarOpen(prev => !prev)}
              title={sidebarOpen ? "Hide Documents" : "View Documents & Knowledge Vault"}
              className="header-action-btn"
            >
              {sidebarOpen ? <PanelLeftClose size={16} color="var(--primary)" /> : <PanelLeft size={16} color="var(--primary)" />}
              <span>{documents.length} Docs</span>
            </button>

            {/* Live Telemetry Status Pill */}
            <div className="header-telemetry-badge" title="RAG Engine: Groq Llama-3.3-70B via FAISS Top-K Vector Search">
              <span className="telemetry-live-dot" />
              <span className="telemetry-model">Groq Llama-3.3-70B</span>
              <span className="telemetry-divider">•</span>
              <span className="telemetry-stat">FAISS Top-5</span>
              <span className="telemetry-divider">•</span>
              <span className="telemetry-speed">~380ms</span>
            </div>
          </div>

          {/* Center branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--text-heading)' }}>
              PolicyLens
            </span>
            <span className="header-rag-badge">
              RAG
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="header-action-btn theme-toggle-btn"
            >
              {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
              <span className="theme-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              title="Start a new conversation"
              className="header-action-btn new-chat-btn"
            >
              <Plus size={14} />
              <span>New</span>
            </button>

            {/* Chat History Drawer Toggle Button */}
            <button
              onClick={() => setHistoryOpen(prev => !prev)}
              title={historyOpen ? "Hide Chat History" : "View Chat History"}
              className="header-action-btn"
            >
              <History size={15} color="var(--primary)" />
              <span>History</span>
            </button>

            {messages.length > 0 && (
              <button
                onClick={() => { if (confirm('Clear chat history?')) setMessages([]) }}
                title="Clear current thread"
                className="header-action-btn clear-btn"
              >
                Clear
              </button>
            )}
          </div>
        </header>

        {/* Center Chat Area */}
        <div
          className="chat-scroll-area"
          style={{
            flex: 1, overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {messages.length === 0 ? (
            /* Simple Minimalist Home matching user prompt */
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '0 24px 60px', textAlign: 'center',
            }}>
              {/* Only text head name "PolicyLens" with ambient highlight effect & distinct font */}
              <div className="policylens-ambient-container">
                <div className="policylens-ambient-glow" />
                <h1 className="policylens-ambient-word">
                  PolicyLens
                </h1>
              </div>

              {/* With quote "hey, how can i help you?" */}
              <p className="policylens-ambient-subtitle">
                hey, how can i help you?
              </p>

              {/* Stage containing the Chat Space Pill and the standing Businessman Robot */}
              <div className="chat-strip-stage">
                <div className="chat-pill-wrapper">
                  <div className="pill-chat-bar">
                    {/* Plus Icon Button (+) */}
                    <button
                      className="pill-plus-btn"
                      title="Upload or manage documents"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <Plus size={20} />
                    </button>

                    {/* Ask anything input */}
                    <input
                      ref={inputRef}
                      type="text"
                      className="pill-input"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask anything..."
                      disabled={loading}
                      autoFocus
                    />

                    {/* Think badge with brain icon */}
                    <button
                      type="button"
                      className={`pill-think-badge ${thinkOpen ? 'active' : ''}`}
                      title="Click for smart suggestions based on your purpose"
                      onClick={handleToggleThink}
                      style={{ border: 'none' }}
                    >
                      <BrainCircuit size={17} color={thinkOpen ? 'var(--primary)' : 'var(--text-muted)'} />
                      <span style={{ color: thinkOpen ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>Think</span>
                      <span className="think-sparkle-dot" title="Active AI Purpose Engine" />
                    </button>

                    {/* Think Suggestions Popover */}
                    <ThinkSuggestionsPopover
                      isOpen={thinkOpen}
                      onClose={() => setThinkOpen(false)}
                      loading={thinkLoading}
                      data={thinkData}
                      onSelectSuggestion={handleSelectSuggestion}
                      onRefresh={handleToggleThink}
                    />

                    {/* Multi-language Selector */}
                    <div className="pill-lang-wrapper" style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className={`pill-lang-badge ${langOpen ? 'active' : ''}`}
                        title="Choose response language"
                        onClick={() => setLangOpen(prev => !prev)}
                      >
                        <Globe size={16} />
                        <span>{SUPPORTED_LANGUAGES.find(l => l.name === selectedLanguage)?.code || 'EN'}</span>
                      </button>

                      {langOpen && (
                        <div className="pill-lang-dropdown">
                          <div className="pill-lang-title">Response Language</div>
                          {SUPPORTED_LANGUAGES.map(lang => (
                            <button
                              key={lang.code}
                              type="button"
                              className={`pill-lang-item ${selectedLanguage === lang.name ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedLanguage(lang.name)
                                setLangOpen(false)
                                showToast(`Response language set to ${lang.name}`)
                              }}
                            >
                              <span className="lang-flag">{lang.flag}</span>
                              <span className="lang-name">{lang.name}</span>
                              {selectedLanguage === lang.name && <Check size={14} className="lang-check" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Microphone Icon */}
                    <button
                      className="pill-mic-btn"
                      title="Voice input"
                      onClick={() => showToast('Voice input is ready')}
                    >
                      <Mic size={18} />
                    </button>

                    {/* Blue round voice / waveform action button */}
                    <button
                      className="pill-voice-btn"
                      onClick={() => handleSend()}
                      disabled={!input.trim() || loading}
                      title="Send message"
                    >
                      {loading ? (
                        <Loader2 size={18} color="#ffffff" style={{ animation: 'spin 1s linear infinite' }} />
                      ) : input.trim() ? (
                        <Send size={16} />
                      ) : (
                        <AudioWaveform size={19} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Standing Businessman Robot beside the chat strip */}
                <BusinessmanRobo
                  status={roboStatus}
                  speech={roboSpeech}
                  onActionClick={handleRoboClick}
                />
              </div>

              {/* Bento Policy Handbook Playbooks */}
              <BentoHandbookSection onSelectPrompt={(p) => handleSend(p)} />
            </div>
          ) : (
            /* Active conversation view */
            <div className="chat-conversation-container">
              {/* Head name "PolicyLens" that starts above messages and scrolls up above the screen as conversation continues */}
              <div style={{
                textAlign: 'center',
                paddingTop: 16,
                paddingBottom: 24,
                userSelect: 'none',
              }}>
                <div className="policylens-ambient-container" style={{ transform: 'scale(0.88)', marginBottom: 2 }}>
                  <div className="policylens-ambient-glow" />
                  <h1 className="policylens-ambient-word" style={{ fontSize: 42 }}>
                    PolicyLens
                  </h1>
                </div>
                <p className="policylens-ambient-subtitle" style={{ fontSize: 16, marginBottom: 0, color: '#94a3b8' }}>
                  hey, how can i help you?
                </p>
              </div>

              {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} onToast={showToast} />)}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Pill Bar when conversation is active */}
        {messages.length > 0 && (
          <div style={{
            padding: '12px 24px 24px',
            flexShrink: 0,
          }}>
            <div className="chat-strip-stage">
              <div className="chat-pill-wrapper">
                <div className="pill-chat-bar">
                  <button
                    className="pill-plus-btn"
                    title="Upload or manage documents"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Plus size={20} />
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    className="pill-input"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything"
                    disabled={loading}
                    autoFocus
                  />

                  {/* Think badge with brain icon - click to see smart suggestions & purpose */}
                  <button
                    type="button"
                    className={`pill-think-badge ${thinkOpen ? 'active' : ''}`}
                    title="Click for smart suggestions based on your purpose"
                    onClick={handleToggleThink}
                    style={{ border: 'none' }}
                  >
                    <BrainCircuit size={18} color={thinkOpen ? '#2563eb' : '#64748b'} />
                    <span style={{ color: thinkOpen ? '#2563eb' : '#64748b', fontWeight: 600 }}>Think</span>
                    <span className="think-sparkle-dot" title="Active AI Purpose Engine" />
                  </button>

                  {/* Think Suggestions Popover */}
                  <ThinkSuggestionsPopover
                    isOpen={thinkOpen}
                    onClose={() => setThinkOpen(false)}
                    loading={thinkLoading}
                    data={thinkData}
                    onSelectSuggestion={handleSelectSuggestion}
                    onRefresh={handleToggleThink}
                  />

                  {/* Multi-language Selector */}
                  <div className="pill-lang-wrapper" style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className={`pill-lang-badge ${langOpen ? 'active' : ''}`}
                      title="Choose response language"
                      onClick={() => setLangOpen(prev => !prev)}
                    >
                      <Globe size={16} />
                      <span>{SUPPORTED_LANGUAGES.find(l => l.name === selectedLanguage)?.code || 'EN'}</span>
                    </button>

                    {langOpen && (
                      <div className="pill-lang-dropdown">
                        <div className="pill-lang-title">Response Language</div>
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <button
                            key={lang.code}
                            type="button"
                            className={`pill-lang-item ${selectedLanguage === lang.name ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedLanguage(lang.name)
                              setLangOpen(false)
                              showToast(`Response language set to ${lang.name}`)
                            }}
                          >
                            <span className="lang-flag">{lang.flag}</span>
                            <span className="lang-name">{lang.name}</span>
                            {selectedLanguage === lang.name && <Check size={14} className="lang-check" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    className="pill-mic-btn"
                    title="Voice input"
                    onClick={() => showToast('Voice input is ready')}
                  >
                    <Mic size={18} />
                  </button>

                  <button
                    className="pill-voice-btn"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    title="Send message"
                  >
                    {loading ? (
                      <Loader2 size={18} color="#ffffff" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Standing Businessman Robot beside active chat strip */}
              <BusinessmanRobo
                status={roboStatus}
                speech={roboSpeech}
                onActionClick={handleRoboClick}
              />
            </div>
          </div>
        )}
      </main>

      {/* Right-Side Chat History Drawer */}
      <HistorySidebar
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
