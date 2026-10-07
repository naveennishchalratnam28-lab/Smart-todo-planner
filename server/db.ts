import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import type { ITask, IUser } from './types.ts';
import UserModel from './models/User.ts';
import TaskModel from './models/Task.ts';

let isMongooseConnected = false;

// Embedded fallback store path
const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

interface LocalStoreData {
  users: IUser[];
  tasks: ITask[];
}

function loadLocalStore(): LocalStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading local store:', err);
  }
  return { users: [], tasks: [] };
}

function saveLocalStore(data: LocalStoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local store:', err);
  }
}

// In-memory cache for fast lookups
let store: LocalStoreData = loadLocalStore();

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️ No MONGODB_URI provided. Running with built-in persistent JSON repository.');
    return;
  }

  try {
    console.log('Connecting to MongoDB at:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
    // Attempt connection with short timeout so it doesn't hang if Mongo isn't running
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongooseConnected = true;
    console.log('✅ Connected to MongoDB successfully.');
  } catch (error) {
    console.warn('⚠️ Could not connect to MongoDB instance. Falling back to persistent local storage.');
    isMongooseConnected = false;
  }
}

export function isUsingMongo(): boolean {
  return isMongooseConnected;
}

// Unified repository methods so the app behaves identically in both modes
export const dbRepo = {
  // USER OPERATIONS
  async findUserByEmail(email: string): Promise<IUser | null> {
    if (isMongooseConnected) {
      const doc: any = await UserModel.findOne({ email: email.toLowerCase() }).lean();
      if (!doc) return null;
      return { ...doc, _id: doc._id.toString() } as unknown as IUser;
    }
    store = loadLocalStore();
    return store.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id: string): Promise<IUser | null> {
    if (isMongooseConnected) {
      const doc: any = await UserModel.findById(id).lean();
      if (!doc) return null;
      return { ...doc, _id: doc._id.toString() } as unknown as IUser;
    }
    store = loadLocalStore();
    return store.users.find(u => u._id === id) || null;
  },

  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const defaultSettings = {
      dailyHours: 6,
      workingDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      bufferPercent: 15,
    };

    if (isMongooseConnected) {
      const user = new UserModel({
        ...userData,
        settings: { ...defaultSettings, ...userData.settings },
      });
      const saved = await user.save();
      const lean: any = saved.toObject();
      return { ...lean, _id: lean._id.toString() } as unknown as IUser;
    }

    store = loadLocalStore();
    const newUser: IUser = {
      _id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      email: userData.email!.toLowerCase(),
      password: userData.password!,
      name: userData.name || userData.email!.split('@')[0],
      settings: { ...defaultSettings, ...(userData.settings || {}) },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.users.push(newUser);
    saveLocalStore(store);
    return newUser;
  },

  async updateUserSettings(userId: string, settings: Partial<IUser['settings']>): Promise<IUser | null> {
    if (isMongooseConnected) {
      const updated: any = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { settings } },
        { new: true }
      ).lean();
      if (!updated) return null;
      return { ...updated, _id: updated._id.toString() } as unknown as IUser;
    }

    store = loadLocalStore();
    const index = store.users.findIndex(u => u._id === userId);
    if (index === -1) return null;
    store.users[index].settings = {
      ...store.users[index].settings,
      ...settings,
    };
    store.users[index].updatedAt = new Date().toISOString();
    saveLocalStore(store);
    return store.users[index];
  },

  // TASK OPERATIONS
  async findTasksByUserId(userId: string, queryFilters?: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }): Promise<ITask[]> {
    if (isMongooseConnected) {
      const mongoQuery: any = { userId };
      if (queryFilters?.status && queryFilters.status !== 'all') {
        mongoQuery.status = queryFilters.status;
      }
      if (queryFilters?.priority && queryFilters.priority !== 'all') {
        mongoQuery.priority = queryFilters.priority;
      }
      if (queryFilters?.category && queryFilters.category !== 'all') {
        mongoQuery.category = queryFilters.category;
      }
      if (queryFilters?.search) {
        mongoQuery.$or = [
          { title: { $regex: queryFilters.search, $options: 'i' } },
          { description: { $regex: queryFilters.search, $options: 'i' } },
        ];
      }
      const docs: any[] = await TaskModel.find(mongoQuery).sort({ deadline: 1 }).lean();
      return docs.map(d => ({
        ...d,
        _id: d._id.toString(),
        deadline: new Date(d.deadline).toISOString(),
        createdAt: new Date(d.createdAt).toISOString(),
        updatedAt: new Date(d.updatedAt).toISOString(),
      })) as unknown as ITask[];
    }

    store = loadLocalStore();
    let tasks = store.tasks.filter(t => t.userId === userId);

    if (queryFilters?.status && queryFilters.status !== 'all') {
      tasks = tasks.filter(t => t.status === queryFilters.status);
    }
    if (queryFilters?.priority && queryFilters.priority !== 'all') {
      tasks = tasks.filter(t => t.priority === queryFilters.priority);
    }
    if (queryFilters?.category && queryFilters.category !== 'all') {
      tasks = tasks.filter(t => t.category.toLowerCase() === queryFilters.category!.toLowerCase());
    }
    if (queryFilters?.search) {
      const q = queryFilters.search.toLowerCase();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    }

    return tasks.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  },

  async findTaskById(taskId: string, userId: string): Promise<ITask | null> {
    if (isMongooseConnected) {
      const doc: any = await TaskModel.findOne({ _id: taskId, userId }).lean();
      if (!doc) return null;
      return {
        ...doc,
        _id: doc._id.toString(),
        deadline: new Date(doc.deadline).toISOString(),
        createdAt: new Date(doc.createdAt).toISOString(),
        updatedAt: new Date(doc.updatedAt).toISOString(),
      } as unknown as ITask;
    }

    store = loadLocalStore();
    return store.tasks.find(t => t._id === taskId && t.userId === userId) || null;
  },

  async createTask(taskData: Partial<ITask> & { userId: string }): Promise<ITask> {
    if (isMongooseConnected) {
      const task = new TaskModel({
        ...taskData,
        deadline: new Date(taskData.deadline || Date.now()),
      });
      const saved = await task.save();
      const lean: any = saved.toObject();
      return {
        ...lean,
        _id: lean._id.toString(),
        deadline: new Date(lean.deadline).toISOString(),
        createdAt: new Date(lean.createdAt).toISOString(),
        updatedAt: new Date(lean.updatedAt).toISOString(),
      } as unknown as ITask;
    }

    store = loadLocalStore();
    const newTask: ITask = {
      _id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      userId: taskData.userId,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      priority: taskData.priority || 'Medium',
      deadline: taskData.deadline || new Date(Date.now() + 86400000 * 2).toISOString(),
      estimatedEffort: Number(taskData.estimatedEffort) || 1,
      category: taskData.category || 'General',
      status: taskData.status || 'Pending',
      hoursCompleted: Number(taskData.hoursCompleted) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.tasks.push(newTask);
    saveLocalStore(store);
    return newTask;
  },

  async updateTask(taskId: string, userId: string, updates: Partial<ITask>): Promise<ITask | null> {
    if (isMongooseConnected) {
      const docUpdates: any = { ...updates };
      if (updates.deadline) {
        docUpdates.deadline = new Date(updates.deadline);
      }
      const updated: any = await TaskModel.findOneAndUpdate(
        { _id: taskId, userId },
        { $set: docUpdates },
        { new: true }
      ).lean();
      if (!updated) return null;
      return {
        ...updated,
        _id: updated._id.toString(),
        deadline: new Date(updated.deadline).toISOString(),
        createdAt: new Date(updated.createdAt).toISOString(),
        updatedAt: new Date(updated.updatedAt).toISOString(),
      } as unknown as ITask;
    }

    store = loadLocalStore();
    const index = store.tasks.findIndex(t => t._id === taskId && t.userId === userId);
    if (index === -1) return null;

    store.tasks[index] = {
      ...store.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveLocalStore(store);
    return store.tasks[index];
  },

  async deleteTask(taskId: string, userId: string): Promise<boolean> {
    if (isMongooseConnected) {
      const res = await TaskModel.deleteOne({ _id: taskId, userId });
      return res.deletedCount > 0;
    }

    store = loadLocalStore();
    const prevLen = store.tasks.length;
    store.tasks = store.tasks.filter(t => !(t._id === taskId && t.userId === userId));
    saveLocalStore(store);
    return store.tasks.length < prevLen;
  },

  async bulkUpdateTasks(userId: string, taskIds: string[], updates: Partial<ITask>): Promise<number> {
    if (isMongooseConnected) {
      const res = await TaskModel.updateMany(
        { _id: { $in: taskIds }, userId },
        { $set: updates }
      );
      return res.modifiedCount;
    }

    store = loadLocalStore();
    let modified = 0;
    store.tasks = store.tasks.map(t => {
      if (t.userId === userId && taskIds.includes(t._id)) {
        modified++;
        return { ...t, ...updates, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    saveLocalStore(store);
    return modified;
  },

  async bulkDeleteTasks(userId: string, taskIds: string[]): Promise<number> {
    if (isMongooseConnected) {
      const res = await TaskModel.deleteMany({ _id: { $in: taskIds }, userId });
      return res.deletedCount;
    }

    store = loadLocalStore();
    const prev = store.tasks.length;
    store.tasks = store.tasks.filter(t => !(t.userId === userId && taskIds.includes(t._id)));
    const deleted = prev - store.tasks.length;
    saveLocalStore(store);
    return deleted;
  },

  async clearUserTasks(userId: string): Promise<void> {
    if (isMongooseConnected) {
      await TaskModel.deleteMany({ userId });
      return;
    }
    store = loadLocalStore();
    store.tasks = store.tasks.filter(t => t.userId !== userId);
    saveLocalStore(store);
  },
};
