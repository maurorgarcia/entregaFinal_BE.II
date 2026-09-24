const mongoose = require("mongoose");
const config = require("../src/config/config");
const User = require("../src/models/User");
const { userService } = require("../src/services");

async function createAdmin() {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });

  const { email, password } = config.admin;
  let user = await User.findOne({ email });

  if (!user) {
    user = await userService.register({
      first_name: "Admin",
      last_name: "Coder",
      email,
      age: 30,
      password
    });
  }

  await User.updateOne({ _id: user._id }, { role: "admin" });
  console.log(`Administrador listo: ${email}`);
  await mongoose.disconnect();
}

createAdmin().catch(async error => {
  console.error("Error al crear el administrador:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
