import { Supplier } from "../models";
import { Database } from "../types";

type SupplierDetails = Omit<Supplier, "supplier_id" | "created_at" | "updated_at"> 
type RecordId = number
type DbResult<T> = 
    | { success: true; data: T }
    | { success: false; error: string; code?: string };

interface SupplierRepo {

    create_supplier(db: Database, supplier_details: SupplierDetails): RecordId | { error: string }
    update_supplier(db: Database, supplier_id: number, updated_details: Partial<SupplierDetails>): boolean
    get_suppliers_by_company_name(db: Database, company_name: string): DbResult<Array<Supplier>> 
    get_suppliers_by_phone(db: Database, phone: number): DbResult<Array<Supplier>> 
    get_suppliers_by_tin(db: Database, tin: number): DbResult<Array<Supplier>> 
    get_active_suppliers(db: Database, is_active: boolean): DbResult<Array<Supplier>>
    delete_supplier(db: Database, supplier_name: string): void

}

export class SupplierRepository {
    get_all_suppliers() {}
    get_single_supplier() {}
    delete_all_suppliers() {}
    insert_supplier() {}
    update_supplier() {}
}