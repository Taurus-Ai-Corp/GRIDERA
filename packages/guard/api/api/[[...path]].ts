import { build } from './src/server.js'

const appPromise = build()

function normalizePath(pathname = '/', search = '') {
  const params = new URLSearchParams(search)
  params.delete('[...path]')
  const normalizedSearch = params.toString()

  if (pathname === '/api') {
    return normalizedSearch ? `/?${normalizedSearch}` : '/'
  }

  const path = pathname.startsWith('/api/') ? pathname.slice('/api'.length) : pathname
  return normalizedSearch ? `${path}?${normalizedSearch}` : path
}

export default async function handler(req: any, res: any) {
  const app = await appPromise
  const url = req.url || '/'
  const [pathname, search = ''] = url.split('?')
  const response = await (app.inject({
    method: req.method,
    url: normalizePath(pathname, search),
    headers: req.headers,
    payload: req.body,
  }) as unknown as Promise<{
    statusCode: number
    payload: string
    headers: Record<string, string | string[] | undefined>
  }>)

  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(response.headers)) {
    if (value !== undefined) {
      headers[key] = Array.isArray(value) ? value.join(', ') : value
    }
  }

  res.status(response.statusCode)
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value)
  }
  res.send(response.payload)
}
