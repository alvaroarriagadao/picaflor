interface TabDisplayProps {
  tab: string;
}

export default function TabDisplay({ tab }: TabDisplayProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-smoke bg-ink/80 p-5">
      <pre className="tab-block text-sm text-amber sm:text-base">{tab}</pre>
    </div>
  );
}
