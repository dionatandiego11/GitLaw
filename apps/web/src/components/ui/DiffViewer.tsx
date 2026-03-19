interface DiffViewerProps {
  before: string;
  after: string;
  title?: string;
}

function toLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => line.length > 0 || index < lines.length - 1);
}

export function DiffViewer({ before, after, title }: DiffViewerProps) {
  const beforeLines = toLines(before);
  const afterLines = toLines(after);

  return (
    <div className="bg-[#1e1e1e] rounded-xl overflow-hidden text-xs font-mono text-zinc-300 border border-[var(--color-git-border)]">
      <div className="flex items-center justify-between bg-[#2d2d2d] px-4 py-2 text-zinc-400">
        <span>{title ?? 'Comparação legislativa'}</span>
        <span className="text-[10px] uppercase tracking-wider">Prévia</span>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-1">
          {beforeLines.map((line, index) => (
            <div key={`before-${index}`} className="flex">
              <span className="w-8 text-zinc-500 select-none">{index + 1}</span>
              <span className="flex-1 text-[#ff7b72] bg-[rgba(255,123,114,0.1)] px-2 py-1 rounded-sm">
                - {line}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {afterLines.map((line, index) => (
            <div key={`after-${index}`} className="flex">
              <span className="w-8 text-zinc-500 select-none">{index + 1}</span>
              <span className="flex-1 text-[#3fb950] bg-[rgba(63,185,80,0.1)] px-2 py-1 rounded-sm">
                + {line}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
