'use client'

import Image from 'next/image'
import { useFormStatus } from 'react-dom'

export type CreateBoardButtonProps = {
  templateIcon: string
  templateName: string
}

export function CreateBoardButton({ templateIcon, templateName }: CreateBoardButtonProps) {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex h-full w-full flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-4">
        <Image
          src={templateIcon}
          alt={`${templateName} icon`}
          width={32}
          height={32}
          className="h-8 w-8"
          unoptimized
        />
        <h3 className="text-lg font-semibold text-black">
          {templateName}
        </h3>
      </div>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-black transition group-hover:translate-x-0.5">
        {pending ? 'Creating...' : 'Start with this'}
        <span aria-hidden>→</span>
      </span>
    </button>
  )
}
