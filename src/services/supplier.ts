import { SupplierRepository, SupplierDetails } from "../db/repository/supplier_repo"
import { Database  } from "bun:sqlite"
import { Supplier } from "../db/models"


export class SupplierService  { 

    constructor(private repo: SupplierRepository){}

    createSupplier(productDetails: SupplierDetails): number | string {
        const res = this.repo.create_supplier( productDetails)

        if (typeof res == 'number'){
            return res
        } else {
            return res.error
        }
    }

    getAllSuppliers(): Supplier[] | string {
        const res = this.repo.get_all_suppliers()

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getSuppliersByCompanyName(company_name: string): Supplier[] | string {
        const res = this.repo.get_suppliers_by_company_name( company_name)

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getSuppliersByPhone(phone: number): Supplier[] | string {
        const res = this.repo.get_suppliers_by_phone( phone)

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getSuppliersByTin(tin: number): Supplier[] | string {
        const res = this.repo.get_suppliers_by_tin( tin)

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getActiveSuppliers(): Supplier[] | string {
        const res = this.repo.get_active_suppliers()

        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    deleteSupplier(id: number){
        this.repo.delete_supplier(id)
    }

}