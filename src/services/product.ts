import { ProductRepository, ProductDetails, ProductResponse } from "../db/repository/product_repo"
import { Database  } from "bun:sqlite"


export class ProductService  { 

  
    constructor(private repo: ProductRepository) {}

    // services 
    createProduct(productDetails: ProductDetails): number | string {
        const res = this.repo.createProduct( productDetails)
        if (typeof res == 'number'){
            return res
        } else {
            return res.error
        }
    }

    getAllProducts(): ProductResponse[] | string {
        const res =  this.repo.get_all_products()
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getProductsById(id: number): ProductResponse | string {
        const res = this.repo.get_single_product( id)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    //this returns products but user must filter for a unique product 
    getProductByCode(product_code: string): ProductResponse | string {
        const res = this.repo.get_products_by_code( product_code)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getProductsByBarCode(bar_code: string): ProductResponse[] | string {
        const res = this.repo.get_products_by_barcode( bar_code)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    // what will be the criteria?
    getProductsByCategory(category_id: number): ProductResponse[] | string {
        const res = this.repo.get_products_by_category( category_id)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getProductsBySupplier(supplier_id: number): ProductResponse[] | string {
        // create an SQL view for this: where you get a supplier's products
        const res = this.repo.get_products_by_supplier( supplier_id)
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    getActiveProducts(): ProductResponse[] | string {
        const res = this.repo.get_active_products()
        if (res.success == true){
            return res.data
        } else {
            return res.error
        }
    }

    updateProduct(
        product_id: number, 
        updated_details: Partial<ProductDetails>
    ){
        const res = this.repo.update_product( product_id, updated_details)
        return res
    }

    deleteProduct(db: Database, product_id: number) {
        this.deleteProduct(db, product_id)
    }

}