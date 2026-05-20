// ================= DB =================
console.log("ENV CHECK:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ DB connected'))
.catch(err => console.log('❌ DB Error:', err));