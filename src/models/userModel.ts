import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

const userSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .regex(
        /^[a-z0-9@]+$/,
        "Username must only contain lowercase letters, numbers, and @",
      ),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    avatar: z.string(),
    userId: z.string(),
  })
  .strict();

export interface UserType extends Document, z.infer<typeof userSchema> {}
const mongooseSchema: Schema<UserType> = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, required: true },
    userId: { type: String, unique: true, required: true },
  },
  { timestamps: true },
);

if (mongoose.models.User) {
  console.log("Model deleted successfully");
  delete mongoose.models.User;
}

const User = mongoose.model<UserType>("User", mongooseSchema);
export default User;
