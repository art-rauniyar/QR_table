import mongoose, { connect } from 'mongoose';
import './models/profile';
import './models/account';
import './models/customer';
import './models/kitchen';
import './models/menu';
import './models/table';
import './models/order';

if (!process.env.MONGODB_URI) {
	throw new Error('Please add your MongoDB URI to Environment Variables.');
}

const options = {
	autoIndex: false,
	bufferCommands: false, // Prevent mongoose from buffering commands when disconnected
};

// Define global mongoose cache for Next.js hot-reloads and serverless
declare global {
	var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

let cached = globalThis.mongooseCache;

if (!cached) {
	cached = globalThis.mongooseCache = { conn: null, promise: null };
}

async function connectDB () {
	// Return immediately if connection is already established and active
	if (cached.conn && mongoose.connection.readyState === 1) {
		return cached.conn;
	}

	if (!cached.promise) {
		console.log('🌿 Connecting to Mongo Server...');
		cached.promise = connect(process.env.MONGODB_URI!, options)
			.then((mongooseInstance) => {
				console.log('🍃 Mongo Connection Established');
				return mongooseInstance;
			})
			.catch((error) => {
				console.error('🍂 MongoDB Connection Failed: ', error);
				throw error;
			});
	}

	try {
		cached.conn = await cached.promise;
	} catch (e) {
		cached.promise = null;
		throw e;
	}

	return cached.conn;
}

export default connectDB;
