import { SupplierRepository, SupplierDetails } from "../db/repository/supplier_repo"
import { Database  } from "bun:sqlite"
import { Supplier } from "../db/models"


export class SupplierService  { 

    private repo: SupplierRepository

    constructor(){
        this.repo = new SupplierRepository()
    }

    createSupplier(db: Database, productDetails: SupplierDetails): number | string {
        const res = this.repo.create_supplier(db, productDetails)

        if (typeof res == 'number'){
            return res
        } else {
            return res.error
        }
    }

    getAllSuppliers(db: Database): Supplier[] | string {
        const res = this.repo.get_all_suppliers(db)

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getSuppliersByCompanyName(db: Database, company_name: string): Supplier[] | string {
        const res = this.repo.get_suppliers_by_company_name(db, company_name)

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getSuppliersByPhone(db: Database, phone: number): Supplier[] | string {
        const res = this.repo.get_suppliers_by_phone(db, phone)

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getSuppliersByTin(db: Database, tin: number): Supplier[] | string {
        const res = this.repo.get_suppliers_by_tin(db, tin)

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getActiveSuppliers(db: Database): Supplier[] | string {
        const res = this.repo.get_active_suppliers(db)

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    deleteSupplier(db: Database, supplier_name: string){
        this.repo.delete_supplier(db, supplier_name)
    }

}