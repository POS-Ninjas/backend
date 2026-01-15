import { Hono } from 'hono'
import { db } from '../db_service'
import { authMiddleware } from '../middleware/authenticate'

const product_services = db.product_service()
const products = new Hono()

// use middleware
// products.use("*", authMiddleware)

products
    .get("/products/all", async (c) => {
        const allproducts = product_services.getAllProducts(db.database)
        console.log("matched /products/all")
        return c.json({
            success: true,
            data: allproducts,
            timestamp: new Date().toISOString()
        })
    })

products
    .get("/products/:id", async (c) => {
        console.log("matched /products/:id")
        const id = c.req.param('id') as unknown as number
        const product = product_services.getProductsById(db.database, id)

        if (product == null){
            return c.json({
                success: false,
                error: `product with ${id} not found`,
                timestamp: new Date().toISOString()
            })
        } else {

            return c.json({
                success: true,
                data: product,
                timestamp: new Date().toISOString()
            })
        }
    })

products
    .get("/products/create", async (c) => {
        console.log("matched /products/create")
        const product_details = await c.req.json()
        const allproducts = product_services.getAllProducts(db.database)
        return c.json({
            success: true,
            data: allproducts,
            timestamp: new Date().toISOString()
        })
    })

products
    .get("/products", async (c) => {
  
        const code     = c.req.query('code') as string
        const bar_code = c.req.query('barcode') as string
        const category = c.req.query('category') as string 

        if (code == ''){
            return c.json({
                success: false,
                error: "please enter the product code",
                timestamp: new Date().toISOString()
            })
        } else if (bar_code == ''){
            return c.json({
                success: false,
                error: "please enter the product code",
                timestamp: new Date().toISOString()
            })
        } else if (category == ''){
            return c.json({
                success: false,
                error: "please enter the product code",
                timestamp: new Date().toISOString()
            })
        }

        if (code) {
            console.log("matched /products?code=12")
            const product = product_services.getProductByCode(db.database, code)

            if (product == null){
                return c.json({
                    success: false,
                    error: `product with code ${code} not found`,
                    timestamp: new Date().toISOString()
                })
            }

            return c.json({
                success: true,
                data: product,
                timestamp: new Date().toISOString()
            })
        }
        
        if (bar_code) {
            console.log("matched /products?barcode=23")
            const bar_code = c.req.query('barcode') as string
            const products = product_services.getProductsByBarCode(db.database, bar_code)

            return c.json({
                success: true,
                data: products,
                timestamp: new Date().toISOString()
            })
        }
        
        if (category) {
            console.log("matched /products?category=cat_id") // do i construct the url by category name, get the id or just use the category_id
            const category = c.req.query('category') as string 
            const allproducts = product_services.getAllProducts(db.database)
            return c.json({
                success: true,
                data: allproducts,
                timestamp: new Date().toISOString()
            })
        }

    })

products
    .get("/products/:supplier", async (c) => {
        console.log("matched /products/:supplier")
        const product_details = await c.req.json()
        const allproducts = product_services.getAllProducts(db.database)
        return c.json({
            success: true,
            data: allproducts,
            timestamp: new Date().toISOString()
        })
    })

products
    .get("/products/:active", async (c) => {
        console.log("matched /products/:active")
        const active = c.req.query('active')

        return c.json({
            success: true,
            data: active,
            timestamp: new Date().toISOString()
        })
    })

products
    .get("/products/delete", async (c) => {
        console.log("matched /products/delete?name=something")
        const name = c.req.query('name')

        return c.json({
            success: true,
            data: name,
            timestamp: new Date().toISOString()
        })
    })

export default products
