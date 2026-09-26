const apiBaseUrl = (process.env.VITE_API_BASE_URL ?? '').trim()

// Render sets RENDER=true. Same-origin /api only works behind Nginx on a VPS.
if (process.env.RENDER === 'true' && apiBaseUrl === '') {
  console.error(
    'On Render, set VITE_API_BASE_URL to the public API origin (no trailing slash).',
  )
  process.exit(1)
}

if (apiBaseUrl) {
  process.env.VITE_API_BASE_URL = apiBaseUrl.replace(/\/+$/, '')
}
