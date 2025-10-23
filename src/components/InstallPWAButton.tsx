import { usePWAInstall } from '../hooks/usePWAInstall';

export function InstallPWAButton() {
  const { canInstall, installPWA } = usePWAInstall();

  if (!canInstall) {
    return null;
  }

  return (
    <button
      onClick={installPWA}
      className="fixed bottom-20 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all hover:scale-105"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span className="font-semibold text-sm">Install App</span>
    </button>
  );
}
