const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
require('dotenv').config()

const nodemailer = require('nodemailer');
// Definir la carpeta de archivos estáticos
app.use(express.static('public'))

// Configurar Handlebars como motor de plantillas
app.set('view engine', 'hbs')
app.set('views', __dirname + '/views')

// Configurar Body Parser para recibir datos de formulario
app.use(bodyParser.json({ extended: true }))

// Renderizar la plantilla
app.get('/', (req, res) => {
  res.render('index')
})


app.get('/acuse_de_recibo.pdf', function(req, res){
  const filePath = path.join(__dirname, 'acuse_de_recibo.pdf');
  const stat = fs.statSync(filePath);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=acuse_de_recibo.pdf');
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});


app.post('/generar-pdf', (req, res) => {
  try {
    // Recopilar la información del formulario y los canvas
    const pais = req.body.pais;
    const fecha = req.body.fecha;
    const fechaTomada = new Date(fecha);
    const dia = fechaTomada.getDate();
    const mes = fechaTomada.getMonth() + 1; 
    const anio = fechaTomada.getFullYear();
    const fechaFormateada = `${dia}/${mes}/${anio}`
    const nombre = req.body.nombre;
    const empresa = req.body.empresa;
    const identificacion = req.body.identificacion;
    const agente = req.body.agente;
    const imgData1 = req.body.imgData1; // Cambiar canvas por imgData1

    


    const doc = new PDFDocument();

    doc.fontSize(11).font('Helvetica')
      .image('images/logo.png', 240, 40, {width: 130, align: 'center'})
      .text(`En ${pais}, a:     ${dia}/${mes}/${anio}`, 100, 100, {align: 'start'})
      .text(`Yo ${nombre}, trabajador de la empresa de mensajería y paquetería ${empresa}`, 100, 120)
      .text(`con identificación ${identificacion} he recibido de: ${agente} agente de HANNAN-PIPER`, 100, 140)
      .text(`REAL ESTATE un paquete con el contenido de llaves. `, 100, 160)
      .text(`Y para que ello conste, así lo firmo.`, 100, 190)
      .text('Firma / Signature:', 100, 240, {align: 'center'})
      .image(imgData1, 270, 290, {width: 90, align: 'center'})    
    
    // Finalizar y guardar el archivo PDF
    doc.end();
    const filePath = path.join(__dirname, 'acuse_de_recibo.pdf');
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
  
    writeStream.on('finish', () => {
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'login',
          user: 'partesdevisita@hannanpiper.com',
          pass: process.env.PASSWORD
        }
      });

      let mailOptions = {
        from: 'partesdevisita@hannanpiper.com',
        to: `llaves@hannanpiper.com`,
        subject: 'Acuse de Recibo',
        text: `Copia de acuse de recibo 
        Saludos,
        Hannan-Piper Real Estate`,
        attachments: [{
          filename: 'acuse_de_recibo.pdf',
          path: filePath
        }]
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          // console.log(error);
          res.sendStatus(500); // Error al enviar el correo con el PDF
        } else {
          // console.log('Email enviado: ' + info.response);

          // Redirigir al usuario a una ruta después de enviar el correo electrónico
          res.redirect('/exito');
        }
      });
    });
  } catch (err) {
    // console.error(err);
    res.sendStatus(500);
  }
});

app.get('/exito', (req, res) => {
  res.render('exito');
});


// Iniciar el servidor
app.listen(3000, () => console.log(''))
