import { UserRole } from "@prisma/client"
import NextAuth , {type DefaultSession} from "next-auth";

export type ExtendableUser = DefaultSession["user"] & {
    id: string;
    role: UserRole;
}

declare module "next-auth" {
    interface session{
        user: ExtendableUser;
    }
}