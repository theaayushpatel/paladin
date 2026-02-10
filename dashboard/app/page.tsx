/**
 * Home Page
 * Paladin Protocol Dashboard
 */

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">⚔️ Paladin Protocol</h1>
        <p className="text-xl text-paladin-silver mb-8">
          The shield that never sleeps
        </p>
        
        <div className="grid gap-6">
          {/* Components to be implemented */}
          <div className="border border-paladin-gold p-6 rounded-lg">
            <h2 className="text-2xl mb-2">🛡️ The Vigil</h2>
            <p>Monitoring system active...</p>
          </div>
        </div>
      </div>
    </main>
  );
}
