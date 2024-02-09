require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 8080;

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  const githubEvent = req.headers['x-github-event'];
  const payload = req.body;

  const webhooks = JSON.parse(process.env.WEBHOOK_JSON);
  payload.whAction = webhooks[githubEvent];
  payload.issues = payload.pull_request.title.split(']')[0].split('[')[1].split('/');

  await sendRequestToWebhook(payload)
    .then(() => {
      console.log('Requisição para o webhook realizada com sucesso!');
      res.status(200).send('Webhook recebido com sucesso!');
    })
    .catch((error) => {
      console.error('Erro ao realizar a requisição para o webhook:', error.message);
      res.status(500).send('Erro ao processar o webhook');
    });
});

app.listen(port, () => {
  console.log(`Servidor iniciado em http://localhost:${port}`);
});

async function sendRequestToWebhook(payload) {
  const webhookURL = `https://automation.atlassian.com/pro/hooks/${payload.whAction}`;

  try {
    await axios.post(webhookURL, payload, {
      headers: {
        'Content-type': 'application/json'
      }
    });
  } catch (error) {
    throw error;
  }
}
