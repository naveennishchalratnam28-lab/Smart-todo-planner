import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  email: string;
  password?: string;
  name: string;
  settings: {
    dailyHours: number;
    workingDays: number[];
    startTime: string;
    bufferPercent: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    settings: {
      dailyHours: {
        type: Number,
        default: 6,
        min: 1,
        max: 16,
      },
      workingDays: {
        type: [Number],
        default: [1, 2, 3, 4, 5], // Monday - Friday
      },
      startTime: {
        type: String,
        default: '09:00',
      },
      bufferPercent: {
        type: Number,
        default: 15,
        min: 0,
        max: 50,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
export default UserModel;
