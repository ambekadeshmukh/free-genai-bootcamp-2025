
export default function Groups() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Word Groups</h1>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Group Name</th>
                <th className="table-header"># Words</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="table-cell">Core Verbs</td>
                <td className="table-cell">25</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
