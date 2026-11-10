import mongoose from 'mongoose';

const DEFAULT_MONGODB_URI = 'mongodb+srv://aryankalekar9217_db_user:ILWe6Nt7mdV83lHR@cluster0.bkgxmo3.mongodb.net/hireme?retryWrites=true&w=majority';

function getMongoUri(): string {
    let raw = (process.env.MONGODB_URI || '').trim();
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        raw = raw.slice(1, -1).trim();
    }
    if (raw.startsWith('mongodb://') || raw.startsWith('mongodb+srv://')) {
        return raw;
    }
    return DEFAULT_MONGODB_URI;
}

const MONGODB_URI = getMongoUri();

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose | null> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export function isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }

    if (!cached?.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 8000,
            maxPoolSize: 10,
        };

        cached!.promise = mongoose.connect(MONGODB_URI, opts)
            .then((mongooseInstance) => {
                console.log('[HireMe] Connected to MongoDB Atlas / Local Instance');
                return mongooseInstance;
            })
            .catch((err) => {
                console.warn('[HireMe] MongoDB offline or unreachable – operating seamlessly with memory store:', err.message);
                (global as any).__lastMongoError = err.message;
                cached!.promise = null;
                return null;
            });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch {
        cached!.promise = null;
        cached!.conn = null;
    }

    return cached!.conn;
}
