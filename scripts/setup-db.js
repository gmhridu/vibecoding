const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

async function setupDatabase() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/vibecoder';

  console.log('Setting up database with correct table names...');

  try {
    const sql = postgres(connectionString, { max: 1 });

    // Drop existing tables if they exist
    console.log('Dropping existing tables...');
    await sql`DROP TABLE IF EXISTS "account" CASCADE`;
    await sql`DROP TABLE IF EXISTS "accounts" CASCADE`;
    await sql`DROP TABLE IF EXISTS "session" CASCADE`;
    await sql`DROP TABLE IF EXISTS "sessions" CASCADE`;
    await sql`DROP TABLE IF EXISTS "users" CASCADE`;
    await sql`DROP TABLE IF EXISTS "user" CASCADE`;
    await sql`DROP TABLE IF EXISTS "verificationToken" CASCADE`;
    await sql`DROP TABLE IF EXISTS "verification_tokens" CASCADE`;
    await sql`DROP TABLE IF EXISTS "authenticator" CASCADE`;
    await sql`DROP TYPE IF EXISTS "role" CASCADE`;

    // Create enum type
    console.log('Creating role enum...');
    await sql`CREATE TYPE "public"."role" AS ENUM('admin', 'user', 'premium_user')`;

    // Create user table (singular to match NextAuth defaults)
    console.log('Creating user table...');
    await sql`
      CREATE TABLE "user" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text,
        "email" text,
        "emailVerified" timestamp,
        "password" text,
        "image" text,
        "role" "role" DEFAULT 'user' NOT NULL,
        "isActive" boolean,
        "createdAt" timestamp,
        "updatedAt" timestamp,
        CONSTRAINT "user_email_unique" UNIQUE("email")
      )
    `;

    // Create accounts table (plural to match NextAuth defaults)
    console.log('Creating accounts table...');
    await sql`
      CREATE TABLE "accounts" (
        "userId" text NOT NULL,
        "type" text NOT NULL,
        "provider" text NOT NULL,
        "providerAccountId" text NOT NULL,
        "refresh_token" text,
        "access_token" text,
        "expires_at" integer,
        "token_type" text,
        "scope" text,
        "id_token" text,
        "session_state" text
      )
    `;

    // Create sessions table (plural to match NextAuth defaults)
    console.log('Creating sessions table...');
    await sql`
      CREATE TABLE "sessions" (
        "sessionToken" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL,
        "expires" timestamp NOT NULL
      )
    `;

    // Create verification tokens table (plural to match NextAuth defaults)
    console.log('Creating verification_tokens table...');
    await sql`
      CREATE TABLE "verification_tokens" (
        "identifier" text NOT NULL,
        "token" text NOT NULL,
        "expires" timestamp NOT NULL
      )
    `;

    // Create authenticators table
    console.log('Creating authenticator table...');
    await sql`
      CREATE TABLE "authenticator" (
        "credentialID" text NOT NULL,
        "userId" text NOT NULL,
        "providerAccountId" text NOT NULL,
        "credentialPublicKey" text NOT NULL,
        "counter" integer NOT NULL,
        "credentialDeviceType" text NOT NULL,
        "credentialBackedUp" boolean NOT NULL,
        "transports" text,
        CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialID")
      )
    `;

    // Add foreign key constraints
    console.log('Adding foreign key constraints...');
    await sql`ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action`;
    await sql`ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action`;
    await sql`ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action`;

    // Add primary key constraints
    console.log('Adding primary key constraints...');
    await sql`ALTER TABLE "accounts" ADD CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY ("provider", "providerAccountId")`;
    await sql`ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY ("identifier", "token")`;

    console.log('✅ Database setup completed successfully!');
    console.log('✅ All tables created with correct NextAuth-compatible names');

    await sql.end();
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
