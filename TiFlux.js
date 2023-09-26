var moment = require("moment");

const axios = require("axios").default;

const express = require('express');
const app = express();
const PORT = 8080;

app.use(express.json());

app.listen(
  PORT,
  () => console.log(`Server running at http://localhost:${PORT}`)
);

app.post('/getFormatedMsg', (req, res) => {
  const clientSystem = req.body.clientSystem;
  const queueId = req.body.queueId;
  const apiKey = req.body.apiKey;
  const clientName = req.body.clientName;
  const chatId = req.body.chatId;
  const id = req.body.chatId;
  
  if(!clientSystem || !queueId || !apiKey || !clientName || !chatId){
    res.status(422).send({'error':'Missign data'});
}else{

  const header = {
    "accept": "application/json",
    "Content-Type": "application/json",
  }

// FUNÇÃO QUE PUXA AS INFORMAÇÕES DE DETERMINADO CHAT
async function getChat(clientSystem, queueId, apiKey, chatId) {
  try {
    const endpoint = `${clientSystem}/int/getChatMessages`;
    const bodyGetChat = {
      queueId: queueId,
      apiKey: apiKey,
      chatId: chatId,
      includeUserInfo: true,
      includeSystemInfo: true,
      includeSupervisorAlerts: false,
    };
    const headersGetChat = {
      "accept": "application/json",
      "Content-Type": "application/json",
    };
    // console.log("fazendo requisição:", endpoint,bodyGetChat,headersGetChat)
    return axios(endpoint, {
      method: "POST",
      data: bodyGetChat,
      headers: headersGetChat,
    })
      .then((result) => {return result.data})
      .catch((error) => {
        console.log(error);
        throw error;
      });
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    throw error;
  }
}

// FUNÇÃO QUE GERA UM URL DE DOWNLOAD DE ALGUMA MENSAGEM DE MÍDIA
async function getURL(clientSystem, queueId, apiKey, id) {
  try {
    const generateDownloadUrl = `${clientSystem}/int/generateDownloadUrl`;
    const bodyGenerateDownloadUrl = {
      "queueId": queueId,
      "apiKey": apiKey,
      "fileId": id
    };

    return axios(generateDownloadUrl, {
      method: "POST",
      data: bodyGenerateDownloadUrl,
      headers: header
    })
    .then((response) => {
      const data = response.data
      const url = clientSystem.concat(data.path.replace(/true/i, "false"));
      return url;
    })
    .catch((error) => {
      throw error;
    })
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    throw error;
  }
}

// FUNÇÃO QUE FORMATA E ORDENA AS MENSAGENS
async function main(clientSystem, queueId, apiKey, chatId, id) {
  try {
    const chat = await getChat(clientSystem, queueId, apiKey, chatId);
    // Aqui você pode usar a variável 'chat' para fazer o que quiser
    // console.log(chat)
    var atendimento = [];
    for (i = 0; i < chat.messages.length; i++) {
      if (chat.messages[i].direction) {
        switch (chat.messages[i].direction) {
          // mensagem recebida
          case 1:
            if (
              chat.messages[i].fk_file > 0 &&
              chat.messages[i].fk_file != null
            ) {
              let hora = moment(chat.messages[i].srvrcvtime).format(
                "DD/MM/YYYY hh:mm:ss"
              );

              if (chat.messages[i].file_mimetype.includes("image")) {
                atendimento.push(
                  `[${hora}] - ${clientName}: <br> Nome do arquivo: ${
                    chat.messages[i].file_name
                  } <br> <img style='max-width: 200px' src='${await getURL(clientSystem, queueId, apiKey,
                    chat.messages[i].fk_file
                  )}'> </img>`
                );
                atendimento.push("<br>");
              } else if (chat.messages[i].file_mimetype.includes("video")) {
                atendimento.push(
                  `[${hora}] - ${clientName}: <br> Nome do arquivo: ${
                    chat.messages[i].file_name
                  } <video width="380" height="300"controls> <source src='${await getURL(clientSystem, queueId, apiKey,
                    chat.messages[i].fk_file
                  )}'></video>`
                );
                atendimento.push("<br>");
              } else if (chat.messages[i].file_mimetype.includes("audio")) {
                atendimento.push(
                  `[${hora}] - ${clientName}: <br> Nome do arquivo: ${
                    chat.messages[i].file_name
                  } <br> <audio controls> <source src='${await getURL(clientSystem, queueId, apiKey,
                    chat.messages[i].fk_file
                  )}'> </audio>`
                );
                atendimento.push("<br>");
              } else if (
                chat.messages[i].file_mimetype.includes("application") ||
                chat.messages[i].file_mimetype.includes("text")
              ) {
                atendimento.push(
                  `[${hora}] - ${clientName}: <br> Nome do arquivo: ${chat.messages[i].file_name}`
                );
                atendimento.push(
                  `<a target='_blank' href='${await getURL(clientSystem, queueId, apiKey,
                    chat.messages[i].fk_file
                  )}'>Clique para visualizar</a>`
                );
                atendimento.push("<br>");
              }
            } else if (chat.messages[i].message != "") {
              let hora = moment(chat.messages[i].srvrcvtime).format(
                "DD/MM/YYYY hh:mm:ss"
              );
              atendimento.push(
                `[${hora}] - ${clientName}: ${chat.messages[i].message}`
              );
              atendimento.push("<br>");
            } else {
              let hora = moment(chat.messages[i].srvrcvtime).format(
                "DD/MM/YYYY hh:mm:ss"
              );
              atendimento.push(
                `[${hora}] - ${clientName}: ${chat.messages[i].file_name}`
              );
              atendimento.push("<br>");
            }
            break;

          // mensagem enviada
          case 2:
            if (
              chat.messages[i].fk_file > 0 &&
              chat.messages[i].fk_file != null
            ) {
              let hora = moment(chat.messages[i].srvrcvtime).format(
                "DD/MM/YYYY hh:mm:ss"
              );

              if (chat.messages[i].file_mimetype.includes("image")) {
                atendimento.push(
                  `[${hora}] - Atendente: <br> Nome do arquivo: ${
                    chat.messages[i].file_name
                  } <br> <img style='max-width: 200px' src='${await getURL(clientSystem, queueId, apiKey,
                    chat.messages[i].fk_file
                  )}'> </img>`
                );
                atendimento.push("<br>");
              } else if (chat.messages[i].file_mimetype.includes("video")) {
                atendimento.push(
                  `[${hora}] - Atendente: <br> Nome do arquivo: ${
                    chat.messages[i].file_name
                  } <video width="380" height="300"controls> <source src='${await getURL(clientSystem, queueId, apiKey,
                    chat.messages[i].fk_file
                  )}'></video>`
                );
                atendimento.push("<br>");
              } else if (chat.messages[i].file_mimetype.includes("audio")) {
                atendimento.push(
                  `[${hora}] - Atendente: <br> Nome do arquivo: ${
                    chat.messages[i].file_name
                  } <br> <audio controls> <source src='${await getURL(clientSystem, queueId, apiKey,
                    chat.messages[i].fk_file
                  )}'> </audio>`
                );
                atendimento.push("<br>");
              } else if (
                chat.messages[i].file_mimetype.includes("application") ||
                chat.messages[i].file_mimetype.includes("text")
              ) {
                atendimento.push(
                  `[${hora}] - Atendente: <br> Nome do arquivo: ${chat.messages[i].file_name}`
                );
                atendimento.push(
                  `<a target='_blank' href='${await getURL(clientSystem, queueId, apiKey,
                    chat.messages[i].fk_file
                  )}'>Clique para visualizar</a>`
                );
                atendimento.push("<br>");
              }
            } else if (chat.messages[i].message != "") {
              let hora = moment(chat.messages[i].srvrcvtime).format(
                "DD/MM/YYYY hh:mm:ss"
              );
              atendimento.push(`[${hora}] -  ${chat.messages[i].message}`);
              atendimento.push("<br>");
            } else {
              let hora = moment(chat.messages[i].srvrcvtime).format(
                "DD/MM/YYYY hh:mm:ss"
              );
              atendimento.push(
                `[${hora}] - ${agentName}: ${chat.messages[i].file_name}`
              );
              atendimento.push("<br>");
            }
            break;

          case 10:
            let hora = moment(chat.messages[i].srvrcvtime).format(
              "DD/MM/YYYY hh:mm:ss"
            );
            atendimento.push(
              `[${hora}] - SISTEMA: ${chat.messages[i].message}`
            );
            atendimento.push("<br>");
            break;
        }
      } else {
        // aqui vai todos os objetos que não tem o parametro "direction"
        atendimento.push(`MENSAGEM QUEBRADA`);
      }
    }
  } catch (error) {
    console.log(error);
  }
  // console.log(atendimento);
  return atendimento;
}

async function chat(clientSystem, queueId, apiKey, chatId, id){
  const conversas = await main(clientSystem, queueId, apiKey, chatId, id);
  var chat = "";
  for (i = 0; i < conversas.length; i++) {
    chat += `${conversas[i]} `;
  }
  console.log(chat);
  return chat;
}
chat(clientSystem, queueId, apiKey, chatId, id)
.then((chat) => {
  res.status(200).send(chat);
})
}});
