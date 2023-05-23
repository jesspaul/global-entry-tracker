const functions = require('firebase-functions');
const {Router} = require('express');
const express = require('express');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const cors = require('cors');
const app = express();
const router = new Router();
const {verifyAccess} = require('./auth');
const nodemailer = require('nodemailer');
const moment = require('moment');
moment.locale();

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.MAILER_PASS,
  },
});
const mailOptions = {
  from: process.env.EMAIL,
  to: process.env.EMAIL,
  subject: 'Global Entry Appt',
  html: 'Global Entry Appt',
};

router.get('/', async (request, response) => {
  try {
    const result = await axios.get('https://ttp.cbp.dhs.gov/schedulerapi/slot-availability?locationId=5182');
    if (result.data.availableSlots.length) {
      const availableSlots = result.data.availableSlots;
      // appointments are taken so fast, assume only one element in the array
      const apptTime = moment(result.data.availableSlots[0].startTimestamp).format('LLLL');
      availableSlots[0].apptTime = apptTime;

      await mailTransport.sendMail({
        ...mailOptions,
        subject: `Global Entry Appt - ${apptTime}`,
        html: /* html*/ `
          <div style="margin-bottom:20px">Appointment: ${JSON.stringify(availableSlots)}</div>
          <a style="margin-bottom:20px" href="https://ttp.cbp.dhs.gov/schedulerui/">Link</a>
        `,
      });
    }

    response.json(result.data);
  } catch (e) {
    console.log(e);
    response.json({error: e.message});
  }
});

// Express setup
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ],
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// API
app.use('/', verifyAccess, router);

// The 404 Route (ALWAYS Keep this as the last route)
app.get('*', (req, res) => {
  res.status(404).json({});
});


exports.global_entry_tracker = functions
    .runWith({memory: '2GB', timeoutSeconds: 540})
    .https
    .onRequest(app);
