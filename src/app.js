// Importar módulos necesarios
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const MySQLStore = require('express-mysql-session')(session);
const bodyparser = require('body-parser');
const fileUpload = require("express-fileupload");
const helmet = require('helmet');
const multer = require('multer');

// Importar módulos locales
const { MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT } = require("./keys");
require('./lib/passport');

// Crear aplicación Express
const app = express();
const upload = multer({ dest: 'uploads/' });

// Configurar almacenamiento de sesiones
const options = {
    host: MYSQLHOST,
    port: MYSQLPORT,
    user: MYSQLUSER,
    password: MYSQLPASSWORD,
    database: MYSQLDATABASE,
    createDatabaseTable: true
};
const sessionStore = new MySQLStore(options);

// Configurar Handlebars
const handlebars = exphbs.create({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    extname: '.hbs',
    helpres: require('./lib/handlebars')
});

// Configurar motor de vistas
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');

// Configurar middleware
app.use(upload.single('multimedia'));
app.post('/upload', upload.single('multimedia'), (req, res) => {
    // El archivo se encuentra en req.file
    // Puedes procesarlo como desees, por ejemplo, guardarlo en la base de datos o en el sistema de archivos
    res.send('Archivo subido exitosamente');
});
app.use(fileUpload({ createParentPath: true }));
app.use(morgan('dev'));
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(session({
    key: 'session_cookie_name',
    secret: 'session_cookie_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Configura según tus necesidades
        httpOnly: true,
        sameSite: 'Lax' // O 'Strict' dependiendo de tus necesidades de seguridad
    }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error interno del servidor');
});

// Configurar variables globales
app.use((req, res, next) => {
    app.locals.message = req.flash('message');
    app.locals.success = req.flash('success');
    app.locals.user = req.user;
    next();
});

app.use(helmet());

// Configurar archivos estáticos
app.use(express.static('publics'));

// Rutas - Definir tus rutas aquí
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const gestionContenidoRoutes = require('./routes/gestionContenidoRoutes');
const informacionSeguridadRoutes = require('./routes/informacionSeguridadRoutes');
const actividadInteractivaRoutes = require('./routes/actividadInteractivaRoutes');
// Rutas
app.use(authRoutes);
app.use(usuarioRoutes);
app.use(gestionContenidoRoutes);
app.use(informacionSeguridadRoutes);
app.use(actividadInteractivaRoutes);

// Exportar la aplicación
module.exports = app;