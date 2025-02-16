
import { FileText, Users, Clock, Activity } from 'lucide-react';

const stats = [
  {
    name: 'Active Words',
    value: '124',
    icon: FileText,
    color: 'text-secondary',
  },
  {
    name: 'Study Sessions',
    value: '28',
    icon: Users,
    color: 'text-primary',
  },
  {
    name: 'Activities',
    value: '12',
    icon: Activity,
    color: 'text-secondary',
  },
  {
    name: 'Hours Learned',
    value: '48',
    icon: Clock,
    color: 'text-primary',
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <img 
          src="/lovable-uploads/1f0c7e17-ff54-492c-8b63-346f54a741d3.png"
          alt="Apprenons Le Français"
          className="mx-auto h-54 w-auto"
        />
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Track your progress, practice vocabulary, and master the French language
        </p>
        <img 
          src="/lovable-uploads/970354d9-75b7-45f3-8f3e-6e372031af76.png"
          alt="French learning illustration"
          className="mx-auto mt-8 max-w-xl w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-semibold mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
