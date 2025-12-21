import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from './models/Doctor.js';

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medicare');
        const doctors = await Doctor.find().populate('userId', 'name');
        console.log('Total Doctors:', doctors.length);
        doctors.forEach(d => {
            console.log(`- ${d.userId.name} (${d.specialization})`);
        });
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

verify();
