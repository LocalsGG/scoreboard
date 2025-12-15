import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function getRedirectBaseUrl(request: Request): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const host = request.headers.get('host')
  
  const finalHost = forwardedHost || host
  if (finalHost) {
    let protocol = 'https://'
    if (forwardedProto) {
      protocol = `${forwardedProto}://`
    } else if (process.env.NODE_ENV === 'development') {
      protocol = 'http://'
    }
    return `${protocol}${finalHost}`
  }

  const { origin } = new URL(request.url)
  return origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  const baseUrl = await getRedirectBaseUrl(request)
  
  if (error) {
    return NextResponse.redirect(`${baseUrl}/auth?error=${encodeURIComponent(error)}`)
  }
  
  // Check if we have checkout redirect params
  const redirect = searchParams.get('redirect')
  const plan = searchParams.get('plan')
  const isAnnual = searchParams.get('isAnnual')
  
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    next = '/dashboard'
  }
  
  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      const errorMsg = exchangeError.message || 'Unknown error'
      return NextResponse.redirect(`${baseUrl}/auth?error=${encodeURIComponent(errorMsg)}`)
    }
    
    // If we have checkout params, redirect to a checkout trigger page
    if (redirect === 'pricing' && plan) {
      const params = new URLSearchParams({
        plan,
        ...(plan !== 'lifetime' && isAnnual && { isAnnual }),
      })
      return NextResponse.redirect(`${baseUrl}/pricing?checkout=true&${params.toString()}`)
    }
    
    return NextResponse.redirect(`${baseUrl}${next}`)
  }
  
  return NextResponse.redirect(`${baseUrl}/auth?error=no_code`)
}


