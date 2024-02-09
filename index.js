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
  const whAction = webhooks[githubEvent]
  if (whAction == undefined){
    res.status(404).json({"msg":'Evento não mapeado'});
    return
  }
  try {
    payload.issues = payload.pull_request.title.split(']')[0].split('[')[1].split('/');
  } catch (error) {
    console.log('O titulo da pull request não possui o padrão de tarefa', payload.pull_request.title);
    res.status(200).json({"msg": 'O titulo da pull request não possui o padrão de tarefa'});
    return 
  }
 

  await sendRequestToWebhook(payload)
    .then(() => {
      console.log('Requisição para o webhook realizada com sucesso!');
      res.status(200).json({"msg": 'Webhook recebido com sucesso!'});
    })
    .catch((error) => {
      console.error('Erro ao realizar a requisição para o webhook:', error.message);
      res.status(500).json({"msg":'Erro ao processar o webhook'});
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
