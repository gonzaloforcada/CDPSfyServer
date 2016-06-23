var fs = require('fs');
//var track_model = require('./../models/track');
var request = require('request');
var models = require('../models/models.js');

// Devuelve una lista de las canciones disponibles y sus metadatos
exports.list = function (req, res) {
	models.Track.findAll().then(function(tracks) {
		res.render('tracks/index', {
			tracks: tracks,
			errors: []
		});
	})
};

// Devuelve la vista del formulario para subir una nueva canción
exports.new = function (req, res) {
	res.render('tracks/new');
};

// Devuelve la vista de reproducción de una canción.
// El campo track.url contiene la url donde se encuentra el fichero de audio
exports.show = function (req, res) {
	models.Track.findById(req.params.trackId).then(function(track) {
		res.render('tracks/show', {
			track: track,
			errors: []
		});
	})
};


exports.load = function (req, res, next, trackId) {
	models.Track.find(trackId).then(function(track) {
		if(track) {
			req.track = track;
			next();
		} else {
			next(new Error('No existe ' + trackId));
		}
	}).catch(function(error){ next(error)});
};

// Escribe una nueva canción en el registro de canciones.
// TODO:
// - Escribir en tracks.cdpsfy.es el fichero de audio contenido en req.files.track.buffer
// - Escribir en el registro la verdadera url generada al añadir el fichero en el servidor tracks.cdpsfy.es

exports.create = function (req, res) {

	var track = req.files.track;

	//seleccionamos la url del lb
	var urlPost = 'http://10.1.1.1/tracks';
	
	//comprobamos que hay un track seleccionado
	if (track==undefined){
		res.redirect('/tracks/new');
		console.log('No hay ninguna canción seleccionada');
		return;
	}

	console.log('Nuevo fichero de audio. Datos: ', track);
	var id = track.name.split('.')[0];
	var name = track.originalname.split('.')[0];

	//seleccionamos extension del fichero
	var extension = track.originalname.split('.')[1];

	// Aquí debe implementarse la escritura del fichero de audio (track.buffer) en tracks.cdpsfy.es
	// Esta url debe ser la correspondiente al nuevo fichero en tracks.cdpsfy.es
	var url =  'http://10.1.1.1/tracks/';
	var buffer = track.buffer;
	
	//POST: guardar canción 
	var formData = {
		filename: name + '.' + extension,
		my_buffer: buffer
	};
	
	request.post({url:urlPost, formData: formData}, function optionalCallback(err, httpResponse, body) {
		if (err) {
			return console.error('Fallo al subir el archivo:', err);
		} else {
			//guardamos la url que será la respuesta si el proceso finaloiza con exito
			//el body de la respuesta tendra el formato name.extension
			// Escribe los metadatos de la nueva canción en el registro.
		
			console.log('body: ' + body);
			models.Track.create({
				name: name,
				url : url + body,
			}).then(function() {
				res.redirect('/tracks');
			})
		}
	});
};


// Borra una canción (trackId) del registro de canciones 
// - Eliminar en tracks.cdpsfy.es el fichero de audio correspondiente a trackId

exports.destroy = function (req, res) {
	var trackId = req.params.trackId;
	
	var urlDestroy = 'http://10.1.1.1/tracks/' + trackId;

	models.Track.findById(req.params.trackId).then(function(track) {
		var nombre = track.url;
		console.log('Nombre: ' + nombre);
		console.log('Track Id: ' + trackId);

		request.del(urlDestroy + nombre);

		track.destroy().then(function(){
			res.redirect('/tracks');
		});
	});
};