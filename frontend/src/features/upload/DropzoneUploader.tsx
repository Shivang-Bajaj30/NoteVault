import React, { useState, useRef, useEffect } from 'react'
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button, Input, Textarea, Card } from '../../components/ui'
import { useUploadNote } from '../../api/useNotesApi'
import { useClasses } from '../../api/useClassesApi'
import { useAuth } from '../../lib/auth'
import { getApiErrorMessage } from '../../lib/api'

export interface DropzoneUploaderProps {
  onSuccess?: () => void
}

export function DropzoneUploader({ onSuccess }: DropzoneUploaderProps) {
  const { user, isTrusted } = useAuth()
  const { data: classes = [] } = useClasses()
  const uploadMutation = useUploadNote()

  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('Computer Science')
  const [classId, setClassId] = useState('cs201')
  const [tagsInput, setTagsInput] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadFeedback, setUploadFeedback] = useState<{ noteId: string; autoPublished: boolean } | null>(null)

  useEffect(() => {
    if (classes.length && !classes.some((studyClass) => studyClass.id === classId)) {
      setClassId(classes[0].id)
      setSubject(classes[0].subject)
    }
  }, [classes, classId])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f?: File) => {
    if (!f) return
    setErrorMessage(null)

    if (f.size > 25 * 1024 * 1024) {
      setErrorMessage('File exceeds maximum allowed size (25 MB).')
      return
    }

    const validExtensions = /\.(pdf|pptx?|docx?|png|jpe?g)$/i
    if (!validExtensions.test(f.name)) {
      setErrorMessage('Please upload a valid document (PDF, Word, PowerPoint, or image).')
      return
    }

    setFile(f)
    if (!title) {
      const baseName = f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!file) {
      setErrorMessage('Please attach a study document before publishing.')
      return
    }

    if (title.trim().length < 4) {
      setErrorMessage('Please provide a descriptive title (at least 4 characters).')
      return
    }

    if (description.trim().length < 15) {
      setErrorMessage('Please write a brief summary of the material (at least 15 characters).')
      return
    }

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const result = await uploadMutation.mutateAsync({
        title: title.trim(),
        file,
        description: description.trim(),
        subject,
        classId,
        tags: tags.length > 0 ? tags : ['Study Guide', 'Lecture Notes'],
        fileName: file.name,
        isTrusted: !!isTrusted,
        uploaderName: user?.name || 'Moderator Contributor',
        uploaderId: user?.id || 'usr_mod',
      })

      setUploadFeedback({ noteId: result.note.id, autoPublished: result.autoPublished })

      // Reset form
      setFile(null)
      setTitle('')
      setDescription('')
      setTagsInput('')

      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err, 'Failed to submit document. Please try again.'))
    }
  }

  return (
    <Card className="p-6 sm:p-8 border-indigo-200/70 dark:border-indigo-900/40 shadow-sm bg-gradient-to-b from-white via-white to-indigo-50/20 dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/20">
      {uploadFeedback ? (
        <div className="py-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h3 className="text-lg font-bold text-emerald-950 dark:text-emerald-100">
            {uploadFeedback.autoPublished ? '✨ Published Instantly to Vault!' : '🛡️ Submitted to Peer Review Queue'}
          </h3>

          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 max-w-md mx-auto leading-relaxed bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
            {uploadFeedback.autoPublished
              ? 'As a Trusted Contributor, your note is available in the public catalog. The backend recorded the publishing event.'
              : 'Your note is safely in the review queue. Once an administrator approves it, your trust score will progress toward 5 approvals!'}
          </p>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setUploadFeedback(null)}
            className="mt-3 font-semibold text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
          >
            Upload Another Document
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header with colorful subtitle */}
          <div className="pb-3 border-b border-indigo-100 dark:border-zinc-800">
            <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shadow-xs">
                <Upload className="w-4 h-4" />
              </span>
              Academic Document Ingestion
            </h3>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
              Add course material and metadata. The backend records each submission for review and discovery.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Drag & Drop Target */}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {!file ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                handleFile(e.dataTransfer.files[0])
              }}
              className={`p-10 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-100/50 dark:bg-indigo-950/50 scale-[1.01]'
                  : 'border-indigo-300/80 hover:border-indigo-500 bg-gradient-to-b from-indigo-50/60 via-purple-50/30 to-white dark:border-indigo-800/80 dark:bg-zinc-800/50 hover:shadow-md'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mb-3 shadow-md shadow-indigo-500/25">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                Click to attach or drag & drop course notes here
              </h4>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                Supports PDF, Word, PowerPoint, or clean lecture scans up to 25 MB
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-900 dark:text-zinc-100 truncate max-w-sm">
                    {file.name}
                  </p>
                  <span className="text-[11px] text-stone-500 dark:text-zinc-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · Selected for upload
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-zinc-800"
                aria-label="Remove attached file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Note Document Title"
                placeholder="e.g. Master Algorithm Analysis & Graph Traversal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                Course Association
              </label>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value)
                  const match = classes.find((c) => c.id === e.target.value)
                  if (match) setSubject(match.subject)
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.subject}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Subject / Academic Discipline"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Computer Science"
              required
            />

            <div className="md:col-span-2">
              <Textarea
                label="Summary & Topic Coverage"
                placeholder="Briefly describe the key chapters, formulas, or problem sets covered in this document..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Topic Tags (comma-separated)"
                placeholder="e.g. Algorithms, Trees, Big-O, Final Review"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                helperText="Use specific keywords to improve keyword search results."
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={uploadMutation.isPending}
            className="w-full mt-2"
          >
            {isTrusted ? '⚡ Publish Notes Immediately (Trusted)' : 'Submit Notes for Admin Review'}
          </Button>
        </form>
      )}
    </Card>
  )
}
