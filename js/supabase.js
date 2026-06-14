/* global supabase */
/* exported DatabaseConnection */

class DatabaseConnection {
  static #instance = null;
  static #client = null;

  constructor() {
    if (DatabaseConnection.#instance) {
      return DatabaseConnection.#instance;
    }

    const SUPABASE_URL = 'https://iohwgqjzqbnfyyzaehrs.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_jAXnBsdmhO4swuPkTKBJGg_789U-9jB';

    DatabaseConnection.#client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    DatabaseConnection.#instance = this;
  }

  static getInstance() {
    if (!DatabaseConnection.#instance) {
      DatabaseConnection.#instance = new DatabaseConnection();
    }
    return DatabaseConnection.#instance;
  }

  getClient() {
    return DatabaseConnection.#client;
  }
}

// Opcional: Instanciar una vez para dejar la conexión lista
DatabaseConnection.getInstance();

window.DatabaseConnection = DatabaseConnection;
