
export default function Words() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Words</h1>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">French</th>
                <th className="table-header">Phonetics</th>
                <th className="table-header">English</th>
                <th className="table-header"># Correct</th>
                <th className="table-header"># Wrong</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="table-cell">Bonjour</td>
                <td className="table-cell">bɔ̃.ʒuʁ</td>
                <td className="table-cell">Hello</td>
                <td className="table-cell">12</td>
                <td className="table-cell">2</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
