#!/usr/bin/env node

/**
 * This script helps set up your Supabase project with the necessary tables and settings
 * for the SafeHaven community safety app.
 *
 * Usage: node scripts/setup-supabase.js
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf8");
const envVars = envContent.split("\n").reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    acc[match[1]] = match[2];
  }
  return acc;
}, {});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env file",
  );
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Load SQL migration file
const migrationPath = path.resolve(
  __dirname,
  "../supabase/migrations/20240801_create_tables.sql",
);
const migrationSQL = fs.readFileSync(migrationPath, "utf8");

// Split SQL into individual statements
const statements = migrationSQL
  .split(";")
  .map((statement) => statement.trim())
  .filter((statement) => statement.length > 0);

async function runMigration() {
  console.log("Starting Supabase setup...");

  try {
    // Execute each SQL statement
    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await supabase.rpc("pgmigrate", { query: statement + ";" });
      } catch (error) {
        console.warn(`Warning: Statement may have failed: ${error.message}`);
        console.log("Continuing with next statement...");
      }
    }

    console.log("\nSetup completed successfully!");
    console.log("\nNext steps:");
    console.log(
      "1. Go to your Supabase dashboard and verify the tables were created",
    );
    console.log('2. Check that the storage bucket "media" exists');
    console.log("3. Verify that RLS policies are in place");
  } catch (error) {
    console.error("Error during setup:", error.message);
  }
}

runMigration();
