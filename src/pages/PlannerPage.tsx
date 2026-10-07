import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { PlanTimeline } from '../components/PlanTimeline';

interface PlannerPageProps {
  onOpenTaskModal: () => void;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({ onOpenTaskModal }) => {
  const { schedule } = usePlanner();

  return (
    <div className="space-y-6">
      <PlanTimeline schedule={schedule} onOpenTaskModal={onOpenTaskModal} />
    </div>
  );
};
