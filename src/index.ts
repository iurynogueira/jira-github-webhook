require('dotenv').config();

import axios from 'axios';
import bodyParser from 'body-parser';
import express from 'express';

const app = express();
const port = 8080;

interface PayloadToJira {
  whAction: string;
  issues: string[];
}

interface GHPayload extends PayloadToJira {
  pull_request: any;
}

app.use(bodyParser.json());

app.post('/webhook', async (req: express.Request, res: express.Response) => {
  const githubEvent = req.headers['x-github-event'];
  const payload = req.body as GHPayload;

  const webhooks = JSON.parse(process.env.WEBHOOK_JSON!);
  payload.whAction = webhooks[githubEvent as string];

  if (payload.pull_request) {
    payload.issues = payload.pull_request.title.split(']')[0].split('[')[1].split('/');
  }

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

async function sendRequestToWebhook(payload: PayloadToJira) {
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
