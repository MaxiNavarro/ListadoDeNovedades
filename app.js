var express = require('express');
var session = require('express-session');
var hbs = require('express-handlebars');
var mongoose = require('mongoose');
var app = express();

app.use(express.static('public'));

app.use(session({secret: 'claveSecreta'}));

app.engine('hbs', hbs());
app.set('view engine', 'hbs');

app.use(express.urlencoded());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/tablero_novedades', {useNewUrlParser: true, useUnifiedTopology: true});

var usuarioSchema = mongoose.Schema({
    usuario: String,
    legajo: Number, // Si bién no lo uso, este campo me llevaría a la info del empleado (empleadoSchema).
    password: String
});

var Usuario = mongoose.model('Usuario', usuarioSchema);

var novedadesSchema = mongoose.Schema({
    novedad: String,
    creador: String
});

var Novedades = mongoose.model('Novedades', novedadesSchema);

app.get('/', function(req, res) {
    res.redirect('/formulario_login');
});

app.get('/formulario_registro', function(req, res) {
    res.render('registracion');
    return;
});

app.post('/registracion', async function(req, res) {
    if(req.body.usuario.length == 0 || req.body.legajo.length == 0  || req.body.password.length == 0) {
        res.render('registracion', {mensaje_error: 'Debe completar todos los datos',
                                    user: req.body.usuario, 
                                    file: req.body.legajo, 
                                    pass: req.body.password});
        return;
    }
    var user = await Usuario.findOne({usuario: req.body.usuario});

    if(user) {
        res.render('registracion', {mensaje_error: 'El usuario ya existe',
                                    user: req.body.usuario, 
                                    file: req.body.legajo, 
                                    pass: req.body.password});
        return;
    } else {
        var user = new Usuario();
        user.usuario = req.body.usuario;
        user.legajo = req.body.legajo;
        user.password = req.body.password;
        await user.save();
        res.redirect('/formulario_login');
        return;
    }   
});

app.post('/api/registracion', async function(req, res) {
    if(req.body.usuario.length == 0 || req.body.legajo.length == 0  || req.body.password.length == 0 ) {
        res.status(404).send();
    } else {
        var user = await Usuario.findOne({usuario: req.body.usuario});

        if(user) {
            res.status(404).send();
        } else {
        var user = new Usuario();
        user.usuario = req.body.usuario;
        user.legajo = req.body.legajo;
        user.password = req.body.password;
        await user.save();
        res.json(user);
        return;
        }
    }
});

app.get('/formulario_login', function(req, res) {
    res.render('login');
    return;
});

app.post('/login', async function(req, res) {
    if(req.body.usuario.length == 0 || req.body.password.length == 0) {
        res.render('login', {mensaje_error: 'Debe completar todos los datos',
                                    user: req.body.usuario, 
                                    pass: req.body.password});
        return;
    }
    var user = await Usuario.findOne({usuario: req.body.usuario, password: req.body.password});

    if(user) {
        req.session.usuario_id = user._id;
        req.session.usuario = user.usuario;
        res.redirect('/listado');
        return;
    } else {
        res.render('login', {mensaje_error: 'Usuario y/o Password incorrectos', usuario: req.body.usuario});
        return;
    }
});

app.post('/api/login', async function(req, res) {
    var user = await Usuario.findOne({usuario: req.body.usuario, password: req.body.password});
    if(user) {
        req.session.usuario_id = user._id;
        res.json(user);
        return;
    } else {
        res.status(404).send();
    }
});

app.get('/listado', async function(req, res) {
    if(!req.session.usuario_id) {
        res.redirect('/formulario_login');
        return;
    }
    var lista = await Novedades.find();
    var listaReverse = lista.reverse();
    res.render('listado', {listaReverse, usuario: req.session.usuario});
    return;
});

app.get('/api/listado', async function(req, res) {
    if(!req.session.usuario_id) {
        res.redirect('/formulario_login');
        return;
    }
    var lista = await Novedades.find();
    var listaReverse = lista.reverse();
    res.json(listaReverse);
    return;
});

app.get('/ingresar_novedad', function(req, res) {
    if(!req.session.usuario_id) {
        res.redirect('/formulario_login');
        return;
    }
    res.render('ingresar_novedad', {usuario: req.session.usuario});
    return;
});

app.post('/nueva_novedad', async function(req, res) {
    if(!req.session.usuario_id) {
        res.redirect('/formulario_login');
        return;
    }
    if(req.body.novedad.length == 0) {
        res.render('ingresar_novedad', {mensaje_error: 'Debe ingresar una novedad'});
        return;
    }
    var novelty = new Novedades();
    novelty.novedad = req.body.novedad;
    var user = await Usuario.findOne({_id: req.session.usuario_id});
    novelty.creador = user.usuario;
    await novelty.save();
    res.redirect('/listado');
    return;
});

app.post('/api/nueva_novedad', async function(req, res) {
    if(!req.session.usuario_id) {
        res.redirect('/formulario_login');
        return;
    }
    if(req.body.novedad.length == 0) {
        res.status(404).send();
        return;
    }
    var novelty = new Novedades();
    novelty.novedad = req.body.novedad;
    var user = await Usuario.findOne({_id: req.session.usuario_id});
    novelty.creador = user.usuario;
    await novelty.save();
    res.json(novelty);
    return;
});

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.render('login');
    return;
});

app.listen(3000, function(){
    console.log('Corriendo en el puerto 3000');
});