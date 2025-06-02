import { Metadata } from 'next';
import TaskMasterDemo from '@/components/taskmaster/TaskMasterDemo';

export const metadata: Metadata = {
  title: 'TaskMaster AI Demo - AegisWallet',
  description: 'Demonstração da integração TaskMaster + Sequential Thinking no AegisWallet',
};

export default function TaskMasterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">TaskMaster AI</h1>
          <p className="text-gray-600">
            Sistema híbrido de análise e gerenciamento de tarefas que combina TaskMaster com Sequential Thinking
          </p>
        </div>
        
        <TaskMasterDemo />
      </div>
    </div>
  );
}
