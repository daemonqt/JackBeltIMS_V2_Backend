const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const path = require("path");

const roleRoutes = require('./app/routes/roleRoutes.js')
const userRoutes = require('./app/routes/userRoutes.js');
const productRoutes = require('./app/routes/productRoutes.js');
const customerRoutes = require('./app/routes/customerRoutes.js');
const supplierRoutes = require('./app/routes/supplierRoutes.js');
const orderRoutes = require('./app/routes/orderRoutes.js');
const orderToSupplierRoutes = require('./app/routes/orderToSupplierRoutes.js');
const salesRoutes = require('./app/routes/salesRoutes.js');
const inventoryRoutes = require('./app/routes/inventoryRoutes.js');
const freshproductRoutes = require('./app/routes/freshproductRoutes.js');
const dashboardRoutes = require('./app/routes/dashboardRoutes.js');
const chartRoutes = require("./app/routes/chartsData.js");
const reportRoutes = require('./app/routes/reportRoutes.js');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'https://jackbeltimsv2.vercel.app/',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.options('*', cors());

app.use(bodyParser.json());
app.use("/files", express.static(path.join(__dirname, "/app/files/")));

app.use('/api', 
    roleRoutes, 
    userRoutes, 
    customerRoutes, 
    productRoutes, 
    supplierRoutes, 
    orderRoutes, 
    orderToSupplierRoutes, 
    salesRoutes, 
    inventoryRoutes, 
    freshproductRoutes, 
    dashboardRoutes, 
    chartRoutes, 
    reportRoutes 
);

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
    res.json({ message: 'Restful API Backend Using ExpressJS' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});