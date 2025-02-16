
import { useParams } from 'react-router-dom';

export default function StudyActivity() {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Study Activity Details</h1>
      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">Activity #{id}</h2>
        <p className="text-muted-foreground mb-4">
          Details for this specific study activity will be displayed here.
        </p>
      </div>
    </div>
  );
}
