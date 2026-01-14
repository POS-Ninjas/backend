import { Hono } from 'hono'
import { db } from '../db_service'
import { authMiddleware } from '../middleware/authenticate'


const product_services = db.product_service()
const products = new Hono()

// products.use("*", authMiddleware)

products
    .get("/products/all", async (c) => {
        const allproducts = product_services.getAllProducts(db.database)
        return c.json({
            success: true,
            data: allproducts,
            timestamp: new Date().toISOString()
        })
    })

export default products
