import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name'),
    username: text('username').notNull().unique(),
    password: text('password').notNull(),
    role: text('role').default('athlete'), // например, coach/athlete
});
