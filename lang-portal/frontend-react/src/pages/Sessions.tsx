
export default function Sessions() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Study Sessions</h1>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Group Name</th>
                <th className="table-header">Start Time</th>
                <th className="table-header">End Time</th>
                <th className="table-header"># Review Items</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="table-cell">Core Verbs</td>
                <td className="table-cell">2024-03-15 09:30</td>
                <td className="table-cell">2024-03-15 10:15</td>
                <td className="table-cell">25</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
