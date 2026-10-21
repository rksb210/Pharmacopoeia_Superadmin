import mongoose from 'mongoose';

// Register Mongoose connection event listeners for real-time state tracking
mongoose.connection.on('connected', () => {
  console.log('[MongoDB] Connection state: Connected');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error event:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection state: Disconnected');
});

/**
 * Connect to Local / Remote MongoDB Database using Mongoose
 */
export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pharmacopoeia_superadmin';
    const conn = await mongoose.connect(mongoURI);

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.error(`[MongoDB] Please ensure MongoDB is running (e.g. 'docker start mongodb' or local MongoDB service).`);
    // In production, terminate process so orchestrator can restart container
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
