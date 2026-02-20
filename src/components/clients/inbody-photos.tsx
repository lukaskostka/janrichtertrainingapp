'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import { getInBodyPhotoUrls } from '@/lib/actions/inbody'

interface InBodyPhotosProps {
  paths: string[]
}

export function InBodyPhotos({ paths }: InBodyPhotosProps) {
  const [urls, setUrls] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (paths.length === 0) return
    getInBodyPhotoUrls(paths).then(setUrls)
  }, [paths])

  if (urls.length === 0) return null

  return (
    <>
      <div className="mt-2 flex gap-2 overflow-x-auto">
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setExpanded(url)}
            className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border"
          >
            <Image src={url} alt="InBody foto" fill className="object-cover" sizes="64px" />
          </button>
        ))}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpanded(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-card p-2 text-text-primary"
            onClick={() => setExpanded(null)}
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expanded}
            alt="InBody fotka - zvětšená"
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
