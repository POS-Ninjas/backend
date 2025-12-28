import { Client } from "../models";
import { logger } from "../../logger"
import { Database  } from "bun:sqlite"

// Client data structure
export interface ClientDetails {
  client_id?: number
  first_name?: string
  last_name?: string
  phone_number: string
  email: string
  tin: string
  client_type: 'customer' | 'business'
  business_name: string
  business_address?: string
  business_type: 'customer' | 'supplier' | 'export'
  is_active?: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface ClientCreateForm {
  first_name?: string
  last_name?: string
  phone_number: string
  email: string
  tin: string
  client_type: 'customer' | 'business'
  business_name: string
  business_address?: string
  business_type: 'customer' | 'supplier' | 'export'
}

export interface ClientUpdateForm {
  first_name?: string
  last_name?: string
  phone_number?: string
  email?: string
  tin?: string
  client_type?: 'customer' | 'business'
  business_name?: string
  business_address?: string
  business_type?: 'customer' | 'supplier' | 'export'
  is_active?: boolean
}

export interface ClientFilters {
  client_type?: 'customer' | 'business'
  business_type?: 'customer' | 'supplier' | 'export'
  is_active?: boolean
  search?: string // Search across name, email, phone
}

export interface ClientRepo {
  get_all_clients(filters?: ClientFilters): ClientDetails[]
  get_single_client(client_id: number): ClientDetails | null
  get_client_by_email(email: string): ClientDetails | null
  get_client_by_tin(tin: string): ClientDetails | null
  insert_client(client: ClientCreateForm): number
  update_client(client_id: number, updates: ClientUpdateForm): boolean
  delete_client(client_id: number): boolean // Soft delete
  hard_delete_client(client_id: number): boolean // Permanent delete
  restore_client(client_id: number): boolean // Restore soft-deleted
}

export class ClientRepository implements ClientRepo {
  constructor(private db: Database) {}

  /**
   * Get all clients with optional filtering
   */
  get_all_clients(filters?: ClientFilters): ClientDetails[] {
    let queryString = `
      SELECT * FROM clients 
      WHERE deleted_at IS NULL
    `
    const values: any[] = []

    // Apply filters
    if (filters?.client_type) {
      queryString += ` AND client_type = ?`
      values.push(filters.client_type)
    }

    if (filters?.business_type) {
      queryString += ` AND business_type = ?`
      values.push(filters.business_type)
    }

    if (filters?.is_active !== undefined) {
      queryString += ` AND is_active = ?`
      values.push(filters.is_active ? 1 : 0)
    }

    if (filters?.search) {
      queryString += ` AND (
        first_name LIKE ? OR 
        last_name LIKE ? OR 
        email LIKE ? OR 
        phone_number LIKE ? OR
        business_name LIKE ?
      )`
      const searchTerm = `%${filters.search}%`
      values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
    }

    queryString += ` ORDER BY created_at DESC`

    const query = this.db.query(queryString)
    const results = query.all(...values) as ClientDetails[]

    logger.info(`Retrieved ${results.length} clients`)
    return results
  }

  /**
   * Get a single client by ID
   */
  get_single_client(client_id: number): ClientDetails | null {
    const queryString = `
      SELECT * FROM clients 
      WHERE client_id = ? AND deleted_at IS NULL
    `
    const query = this.db.query(queryString)
    const result = query.get(client_id) as ClientDetails | null

    if (result) {
      logger.info(`Retrieved client with ID ${client_id}`)
    } else {
      logger.warn(`Client with ID ${client_id} not found`)
    }

    return result
  }

  /**
   * Get client by email
   */
  get_client_by_email(email: string): ClientDetails | null {
    const queryString = `
      SELECT * FROM clients 
      WHERE email = ? AND deleted_at IS NULL
    `
    const query = this.db.query(queryString)
    const result = query.get(email) as ClientDetails | null

    return result
  }

  /**
   * Get client by TIN
   */
  get_client_by_tin(tin: string): ClientDetails | null {
    const queryString = `
      SELECT * FROM clients 
      WHERE tin = ? AND deleted_at IS NULL
    `
    const query = this.db.query(queryString)
    const result = query.get(tin) as ClientDetails | null

    return result
  }

  /**
   * Insert a new client
   */
  insert_client(client: ClientCreateForm): number {
    // Check for duplicate email
    const existingEmail = this.get_client_by_email(client.email)
    if (existingEmail) {
      throw new Error(`Client with email ${client.email} already exists`)
    }

    // Check for duplicate TIN
    const existingTin = this.get_client_by_tin(client.tin)
    if (existingTin) {
      throw new Error(`Client with TIN ${client.tin} already exists`)
    }

    const queryString = `
      INSERT INTO clients (
        first_name, last_name, phone_number, email, tin,
        client_type, business_name, business_address, business_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const query = this.db.query(queryString)
    const res = query.run(
      client.first_name || null,
      client.last_name || null,
      client.phone_number,
      client.email,
      client.tin,
      client.client_type,
      client.business_name,
      client.business_address || null,
      client.business_type
    )

    logger.info(`Successfully inserted new client with email ${client.email}`)
    return res.lastInsertRowid as number
  }

  /**
   * Update client details (only updates provided fields)
   */
  update_client(client_id: number, updates: ClientUpdateForm): boolean {
    const updateFields: string[] = []
    const values: any[] = []

    // Check each field and add to update if provided
    if (updates.first_name !== undefined) {
      updateFields.push("first_name = ?")
      values.push(updates.first_name)
    }

    if (updates.last_name !== undefined) {
      updateFields.push("last_name = ?")
      values.push(updates.last_name)
    }

    if (updates.phone_number !== undefined) {
      updateFields.push("phone_number = ?")
      values.push(updates.phone_number)
    }

    if (updates.email !== undefined) {
      // Check for duplicate email (excluding current client)
      const existingEmail = this.get_client_by_email(updates.email)
      if (existingEmail && existingEmail.client_id !== client_id) {
        throw new Error(`Email ${updates.email} is already in use`)
      }
      updateFields.push("email = ?")
      values.push(updates.email)
    }

    if (updates.tin !== undefined) {
      // Check for duplicate TIN (excluding current client)
      const existingTin = this.get_client_by_tin(updates.tin)
      if (existingTin && existingTin.client_id !== client_id) {
        throw new Error(`TIN ${updates.tin} is already in use`)
      }
      updateFields.push("tin = ?")
      values.push(updates.tin)
    }

    if (updates.client_type !== undefined) {
      updateFields.push("client_type = ?")
      values.push(updates.client_type)
    }

    if (updates.business_name !== undefined) {
      updateFields.push("business_name = ?")
      values.push(updates.business_name)
    }

    if (updates.business_address !== undefined) {
      updateFields.push("business_address = ?")
      values.push(updates.business_address)
    }

    if (updates.business_type !== undefined) {
      updateFields.push("business_type = ?")
      values.push(updates.business_type)
    }

    if (updates.is_active !== undefined) {
      updateFields.push("is_active = ?")
      values.push(updates.is_active ? 1 : 0)
    }

    // If no fields to update, return false
    if (updateFields.length === 0) {
      logger.warn(`No fields to update for client ID ${client_id}`)
      return false
    }

    // Always update the updated_at timestamp
    updateFields.push("updated_at = datetime('now')")

    // Add client_id to values for WHERE clause
    values.push(client_id)

    const queryString = `
      UPDATE clients 
      SET ${updateFields.join(", ")}
      WHERE client_id = ? AND deleted_at IS NULL
    `

    const query = this.db.query(queryString)
    const res = query.run(...values)

    if (res.changes > 0) {
      logger.info(`Successfully updated client ID ${client_id}`)
      return true
    } else {
      logger.warn(`Failed to update client ID ${client_id} - client not found or already deleted`)
      return false
    }
  }

  /**
   * Soft delete a client (sets deleted_at timestamp)
   */
  delete_client(client_id: number): boolean {
    const queryString = `
      UPDATE clients 
      SET deleted_at = datetime('now'),
          updated_at = datetime('now')
      WHERE client_id = ? AND deleted_at IS NULL
    `

    const query = this.db.query(queryString)
    const res = query.run(client_id)

    if (res.changes > 0) {
      logger.info(`Successfully soft-deleted client ID ${client_id}`)
      return true
    } else {
      logger.warn(`Failed to delete client ID ${client_id} - client not found or already deleted`)
      return false
    }
  }

  /**
   * Permanently delete a client from database
   */
  hard_delete_client(client_id: number): boolean {
    const queryString = `
      DELETE FROM clients 
      WHERE client_id = ?
    `

    const query = this.db.query(queryString)
    const res = query.run(client_id)

    if (res.changes > 0) {
      logger.info(`Successfully hard-deleted client ID ${client_id}`)
      return true
    } else {
      logger.warn(`Failed to hard-delete client ID ${client_id} - client not found`)
      return false
    }
  }

  /**
   * Restore a soft-deleted client
   */
  restore_client(client_id: number): boolean {
    const queryString = `
      UPDATE clients 
      SET deleted_at = NULL,
          updated_at = datetime('now')
      WHERE client_id = ? AND deleted_at IS NOT NULL
    `

    const query = this.db.query(queryString)
    const res = query.run(client_id)

    if (res.changes > 0) {
      logger.info(`Successfully restored client ID ${client_id}`)
      return true
    } else {
      logger.warn(`Failed to restore client ID ${client_id} - client not found or not deleted`)
      return false
    }
  }
}