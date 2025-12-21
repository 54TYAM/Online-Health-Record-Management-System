import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Doctor from './models/Doctor.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medicare');
        console.log('DB Connected');

        const adminExists = await User.findOne({ email: 'admin@medicare.com' });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            await User.create({
                name: 'Super Admin',
                email: 'admin@medicare.com',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Admin created');
        } else {
            console.log('Admin already exists');
        }

        // Specialists Data
        const specialists = [
            // Cardiologists (Heart)
            { name: 'Dr. Rajesh Sharma', email: 'rajesh.sharma@medicare.com', spec: 'Cardiologist', exp: 18, fee: 1200 },
            { name: 'Dr. Priya Gupta', email: 'priya.gupta@medicare.com', spec: 'Cardiologist', exp: 12, fee: 1000 },
            { name: 'Dr. Amit Verma', email: 'amit.verma@medicare.com', spec: 'Cardiologist', exp: 15, fee: 1100 },
            
            // Orthopedics (Bones)
            { name: 'Dr. Suresh Patel', email: 'suresh.patel@medicare.com', spec: 'Orthopedic', exp: 20, fee: 900 },
            { name: 'Dr. Manoj Singh', email: 'manoj.singh@medicare.com', spec: 'Orthopedic', exp: 10, fee: 700 },
            { name: 'Dr. Vikram Rao', email: 'vikram.rao@medicare.com', spec: 'Orthopedic', exp: 14, fee: 850 },

            // Dermatologists (Skin)
            { name: 'Dr. Anjali Mehta', email: 'anjali.mehta@medicare.com', spec: 'Dermatologist', exp: 9, fee: 800 },
            { name: 'Dr. Sneha Reddy', email: 'sneha.reddy@medicare.com', spec: 'Dermatologist', exp: 11, fee: 900 },
            { name: 'Dr. Kavita Iyer', email: 'kavita.iyer@medicare.com', spec: 'Dermatologist', exp: 8, fee: 750 },

            // Neurologists (Brain)
            { name: 'Dr. Sanjay Kumar', email: 'sanjay.kumar@medicare.com', spec: 'Neurologist', exp: 25, fee: 2000 },
            { name: 'Dr. Rakesh Menon', email: 'rakesh.menon@medicare.com', spec: 'Neurologist', exp: 20, fee: 1800 },
            { name: 'Dr. Deepa Nair', email: 'deepa.nair@medicare.com', spec: 'Neurologist', exp: 16, fee: 1500 },

            // Pediatricians (Child)
            { name: 'Dr. Aditi Joshi', email: 'aditi.joshi@medicare.com', spec: 'Pediatrician', exp: 10, fee: 600 },
            { name: 'Dr. Rahul Khanna', email: 'rahul.khanna@medicare.com', spec: 'Pediatrician', exp: 13, fee: 700 },
            { name: 'Dr. Neha Agarwal', email: 'neha.agarwal@medicare.com', spec: 'Pediatrician', exp: 7, fee: 500 },
        ];

        for (const doc of specialists) {
            const userExists = await User.findOne({ email: doc.email });
            if (!userExists) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('pass123', salt);
                
                const user = await User.create({
                    name: doc.name,
                    email: doc.email,
                    password: hashedPassword,
                    role: 'doctor'
                });

                // Create Doctor Profile
                await Doctor.create({
                    userId: user._id,
                    specialization: doc.spec,
                    experience: doc.exp,
                    fees: doc.fee,
                    hospital: doc.spec === 'Cardiologist' ? 'City Heart Center' : 
                              doc.spec === 'Orthopedic' ? 'Ortho Care Clinic' :
                              doc.spec === 'Neurologist' ? 'Brain & Spine Institute' :
                              doc.spec === 'Pediatrician' ? 'Happy Kids Hospital' : 'Medicare Skin Clinic'
                });
                console.log(`Created ${doc.name}`);
            } else {
                console.log(`${doc.name} already exists`);
            }
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seed();
