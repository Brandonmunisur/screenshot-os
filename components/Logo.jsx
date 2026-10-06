import { Command } from 'lucide-react';

export default function Logo() {
  return (
    <div className="brand" aria-label="ScreenshotOS">
      <span className="brand-mark">
        <Command size={18} strokeWidth={2.5} />
      </span>
      <span>ScreenshotOS</span>
    </div>
  );
}
