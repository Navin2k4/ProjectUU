"use server";

import { getPasswordResetTokenByToken } from "@/data/passwordResetToken";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { NewPasswordSchema } from "@/schemas";
import bcryptjs from "bcryptjs"
import * as z from "zod";

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | null
) => {
  if (!token) {
    return { error: "Missing Token" };
  }
  const validatedFields = NewPasswordSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid Fields" };
  }
  const { password } = validatedFields.data;
  const existingToken = await getPasswordResetTokenByToken(token);
  if (!existingToken) {
    return { error: "Invalid Token" };
  }
  const hasExpired = new Date(existingToken.expiresAt) < new Date();
  if (hasExpired) {
    return { error: "Token has Expired" };
  }
  const existingUser = await getUserByEmail(existingToken.email);
  if (!existingUser) {
    return { error: "Email does not exists" };
  }
  const hashedPassword = await bcryptjs.hash(password, 10);
  await db.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
  });
  await db.passwordResetToken.delete({
    where: { id: existingToken.id },
  });
  return { success: "Password Updated" };
};
