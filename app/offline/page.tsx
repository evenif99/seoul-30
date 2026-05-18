export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-4">📡</div>
      <h1 className="text-xl font-bold text-foreground mb-2">오프라인 상태입니다</h1>
      <p className="text-sm text-muted-foreground mb-6">
        인터넷에 연결되지 않았습니다.<br />
        연결을 확인한 후 다시 시도해 주세요.
      </p>
      <a
        href="/"
        className="text-sm font-medium text-primary hover:underline"
      >
        홈으로 돌아가기
      </a>
    </div>
  )
}
