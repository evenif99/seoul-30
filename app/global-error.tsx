'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen items-center justify-center bg-background font-sans antialiased px-4">
        <div className="flex flex-col items-center text-center gap-4 max-w-sm">
          <p className="text-3xl">⚠️</p>
          <p className="text-lg font-bold text-foreground">예기치 못한 오류가 발생했습니다</p>
          <p className="text-sm text-muted-foreground">
            서비스 복구 중입니다. 잠시 후 다시 시도해 주세요.
          </p>
          <button
            onClick={reset}
            className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}
