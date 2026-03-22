import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings — Finance',
};

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-muted-foreground mt-2">Settings will appear here.</p>
    </div>
  );
}
