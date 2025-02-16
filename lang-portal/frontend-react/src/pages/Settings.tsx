
export default function Settings() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Settings</h1>
      <div className="card">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Reset History</h3>
            <p className="text-muted-foreground mb-4">
              This will reset your entire learning history. This action cannot be undone.
            </p>
            <button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md">
              Reset History
            </button>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Dark Mode</h3>
            <p className="text-muted-foreground mb-4">
              Toggle between light and dark theme.
            </p>
            <button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md">
              Toggle Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
