// Push notifications disabled
export function PushNotificationSettings({ className }: { className?: string }) {
  return (
    <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      <p className="text-sm text-gray-500">Push notifications are currently disabled.</p>
    </div>
  );
}
