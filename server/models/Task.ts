import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskDocument extends Document {
  userId: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  deadline: Date;
  estimatedEffort: number;
  category: string;
  status: 'Pending' | 'In Progress' | 'Done';
  hoursCompleted: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    deadline: {
      type: Date,
      required: true,
      index: true,
    },
    estimatedEffort: {
      type: Number,
      required: true,
      min: 0.1,
      default: 1,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Done'],
      default: 'Pending',
    },
    hoursCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active tasks by user ordered by deadline
TaskSchema.index({ userId: 1, deadline: 1 });
TaskSchema.index({ userId: 1, status: 1 });

export const TaskModel = mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);
export default TaskModel;
