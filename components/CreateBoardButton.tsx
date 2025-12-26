'use client'

import Image from 'next/image'
import { useFormStatus } from 'react-dom'
import { motion } from 'framer-motion'

export type CreateBoardButtonProps = {
  templateIcon: string
  templateName: string
}

export function CreateBoardButton({ templateIcon, templateName }: CreateBoardButtonProps) {
  const { pending } = useFormStatus()
  
  return (
    <motion.button
      type="submit"
      disabled={pending}
      className="group flex h-full w-full flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative"
      whileHover={{
        y: -2,
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex items-center gap-4"
        whileHover={{ x: 2 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <Image
            src={templateIcon}
            alt={`${templateName} icon`}
            width={32}
            height={32}
            className="h-8 w-8"
            unoptimized
          />
        </motion.div>
        <h3 className="text-lg font-semibold text-black">
          {templateName}
        </h3>
      </motion.div>
      <motion.span
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-black"
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        {pending ? 'Creating...' : 'Start with this'}
        <motion.span
          aria-hidden
          whileHover={{ x: 2 }}
          transition={{ duration: 0.2 }}
        >
          →
        </motion.span>
      </motion.span>

      {/* Animated background glow on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0"
        whileHover={{ opacity: 0.3 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  )
}
