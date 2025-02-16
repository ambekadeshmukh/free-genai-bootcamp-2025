
export default function StudyActivities() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Study Activities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards for study activities */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Adventure MUD</h3>
          <div className="flex justify-between mt-4">
            <button className="text-primary hover:text-primary/80">View</button>
            <button className="text-secondary hover:text-secondary/80">Launch</button>
          </div>
        </div>
      </div>
    </div>
  );
}
