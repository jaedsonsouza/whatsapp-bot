const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const qrcode = require("qrcode-terminal")

const estados = {}

const palavrasHumano = ["urgente","passando mal","sangue","dor","reclamação","problema"]

function menuPrincipal() {
return `🐾 *Clínica e Pet Shop Passos Pet*

Olá! 🐶🐱  
Como podemos ajudar você hoje?

Digite o número da opção:

1️⃣ Agendar consulta veterinária  
2️⃣ Banho e tosa  
3️⃣ Vacinas  
4️⃣ Produtos da pet shop  
5️⃣ Informações  
6️⃣ Falar com um atendente 👩‍💼`
}

async function startBot() {
const { state, saveCreds } = await useMultiFileAuthState("auth")

const sock = makeWASocket({ auth: state })
sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", (update) => {
if (update.qr) qrcode.generate(update.qr, { small: true })
})

sock.ev.on("messages.upsert", async ({ messages }) => {
const msg = messages[0]
if (!msg.message || msg.key.fromMe) return

const jid = msg.key.remoteJid
const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
const t = texto.toLowerCase()

// emergência direta
if (palavrasHumano.some(p => t.includes(p))) {
await sock.sendMessage(jid, { text: "⚠️ Situação urgente detectada! Chamando um atendente humano agora." })
estados[jid] = { etapa: "humano" }
return
}

if (!estados[jid]) {
estados[jid] = { etapa: "menu" }
await sock.sendMessage(jid, { text: menuPrincipal() })
return
}

const etapa = estados[jid].etapa

// MENU
if (etapa === "menu") {
switch (texto) {
case "1":
estados[jid].etapa = "tipoConsulta"
return sock.sendMessage(jid,{ text:"Qual tipo de atendimento?\n1 Consulta clínica\n2 Retorno\n3 Emergência 🚨\n4 Exames\n0 Voltar ao menu"})
case "2":
estados[jid].etapa = "banhoServico"
return sock.sendMessage(jid,{ text:"Banho e tosa ✂️\n1 Banho\n2 Banho + tosa\n3 Pacotes\n0 Voltar"})
case "3":
estados[jid].etapa = "vacinas"
return sock.sendMessage(jid,{ text:"Vacinas 💉\n1 Filhote\n2 Adulto\n3 Antirrábica\n4 Não sei\n0 Voltar"})
case "4":
estados[jid].etapa = "produtos"
return sock.sendMessage(jid,{ text:"Produtos 🛍️\n1 Ração\n2 Medicamentos\n3 Antipulgas\n4 Acessórios\n5 Brinquedos\n6 Entrega 🚚\n0 Voltar"})
case "5":
return sock.sendMessage(jid,{ 
text: `📍 *Endereço:* Rua Genebaldo Figueredo - Itapuã, Loja 03.
🕒 *Horário de atendimento:*  
Seg a Sex: 8:00 às 18:00  
Sáb: 8:00 às 17:00  
💳 *Formas de pagamento:* Pix, cartão ou dinheiro em espécie  
📦 *Delivery:* Não trabalhamos com delivery no momento.`})
case "6":
estados[jid].etapa = "humano"
return sock.sendMessage(jid,{ text:"Chamando atendente humano 👩‍⚕️ Aguarde..."})
default:
return sock.sendMessage(jid,{ text:"Não entendi 😅 Pode escolher uma das opções do menu?"})
}
}

// CONSULTA
if (etapa === "tipoConsulta") {
if (texto === "3") {
await sock.sendMessage(jid,{ text:"⚠️ EMERGÊNCIA! Vá imediatamente à clínica se for grave."})
estados[jid].etapa="humano"
return
}
estados[jid].etapa="nomePetConsulta"
return sock.sendMessage(jid,{ text:"Nome do pet?"})
}

if (etapa === "nomePetConsulta") {
estados[jid].pet = texto
estados[jid].etapa="especie"
return sock.sendMessage(jid,{ text:"Espécie: 🐶 Cachorro | 🐱 Gato | Outro"})
}

if (etapa === "especie") {
estados[jid].especie = texto
estados[jid].etapa="idadePet"
return sock.sendMessage(jid,{ text:"Idade aproximada?"})
}

if (etapa === "idadePet") {
estados[jid].idade = texto
estados[jid].etapa="periodo"
return sock.sendMessage(jid,{ text:"Período desejado:\nManhã\nTarde\nNoite"})
}

if (etapa === "periodo") {
await sock.sendMessage(jid,{ text:"✅ Pedido enviado para *fila Agendamento Consulta*. Um humano confirmará o horário."})
estados[jid].etapa="menu"
return sock.sendMessage(jid,{ text: menuPrincipal()})
}

// BANHO
if (etapa === "banhoServico") {
estados[jid].etapa="nomePetBanho"
return sock.sendMessage(jid,{ text:"Nome do pet?"})
}

if (etapa === "nomePetBanho") {
estados[jid].etapa="raca"
return sock.sendMessage(jid,{ text:"Raça?"})
}

if (etapa === "raca") {
estados[jid].etapa="porte"
return sock.sendMessage(jid,{ text:"Porte: Pequeno | Médio | Grande"})
}

if (etapa === "porte") {
estados[jid].etapa="diaBanho"
return sock.sendMessage(jid,{ text:"Melhor dia/turno?"})
}

if (etapa === "diaBanho") {
await sock.sendMessage(jid,{ text:"🛁 Pedido enviado para *fila Banho e Tosa*"})
estados[jid].etapa="menu"
return sock.sendMessage(jid,{ text: menuPrincipal()})
}

// VACINAS
if (etapa === "vacinas") {
estados[jid].etapa="nomePetVacina"
return sock.sendMessage(jid,{ text:"Nome do pet + idade?"})
}

if (etapa === "nomePetVacina") {
await sock.sendMessage(jid,{ text:"💉 Pedido enviado para *fila Vacinas*"})
estados[jid].etapa="menu"
return sock.sendMessage(jid,{ text: menuPrincipal()})
}

// PRODUTOS
if (etapa === "produtos") {
estados[jid].etapa="tipoPetProduto"
return sock.sendMessage(jid,{ text:"Para qual pet? (cão/gato/outro)"})
}

if (etapa === "tipoPetProduto") {
estados[jid].etapa="marcaProduto"
return sock.sendMessage(jid,{ text:"Marca desejada?"})
}

if (etapa === "marcaProduto") {
await sock.sendMessage(jid,{ text:"🛒 Pedido enviado para *fila Vendas*"})
estados[jid].etapa="menu"
return sock.sendMessage(jid,{ text: menuPrincipal()})
}

})
}

startBot()
