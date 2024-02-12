require('dotenv').config();

import axios from 'axios';
import bodyParser from 'body-parser';
import express from 'express';
import { config } from './config';

const app = express();
const port = 8080;

interface PayloadToJira {
  whAction: string;
  issues: string[];
}

interface GHPayload extends PayloadToJira {
  pull_request: any;
  repository: {
    id: number;
    name: string;
    full_name: string;
  }
}

app.use(bodyParser.json());

app.post('/webhook', async (req: express.Request, res: express.Response) => {
  const githubEvent = req.headers['x-github-event'] as string;
  const payload = req.body as GHPayload;

  const webhookProject = config[payload.repository.full_name];
  payload.whAction = webhookProject[githubEvent];

  if (payload.pull_request) {
    payload.issues = getTasksName(payload.pull_request.title); 
  }

  if (payload.whAction) {
    await sendRequestToWebhook(payload)
    .then(() => {
      console.log('Requisição para o webhook realizada com sucesso!');
      res.status(200).send('Webhook recebido com sucesso!');
    })
    .catch((error) => {
      console.error('Erro ao realizar a requisição para o webhook:', error.message);
      res.status(500).send('Erro ao processar o webhook');
    });
  }
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

function getTasksName(PRTitle: string): string[] {
  return PRTitle.split(']')[0].split('[')[1].split('/')
}
