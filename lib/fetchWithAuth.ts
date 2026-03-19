export async function fetchWithAuth(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const res = await fetch(url, options)

  if (res.status === 401) {
    window.location.href = '/login'
    return new Promise(() => {})
  }

  return res
}
