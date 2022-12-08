const API_KEY = '49d0acfa24cb2b7649865319781745cb246fa60b35014f266c30fcc158ef0411';
const API_KEY_MYLIK = 'ceb5f1d7590a0f32cd7dfc5b7b8e2029c66c1f2a3d5052f0ebd8ffda1f8ee8bb';
let walletHandler = [];
let interval;

export async function apiCryptPrice(nameTicketVal) {
   const price = await fetch(
       `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${nameTicketVal}&tsyms=USD&api_key=${API_KEY}`);
   return await price.json();
}

export async function apiListOllCrypt() {
   return  fetch('https://min-api.cryptocompare.com/data/all/coinlist?summary=true')
       .then(list => list.json())
}

//----------------------------
const getCryptoPrice = async (arrWallets) => {
   const price = await fetch(
       `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${arrWallets}&tsyms=USD&api_key=${API_KEY}`);
   return await price.json();
};

export  function updatePriceTickets (wallets, CB){
   // let wal = wallets.split(',')[0]
   // subscribeToTickerOnWs(wal);

   if(wallets.length !== 0)
      interval = setInterval(async () => {
         CB(await getCryptoPrice(wallets));
      }, 5000)
}

export function deleteInterval() {clearInterval(interval);}


//---------------
const tickersHandlers = new Map(); // {}

const socket = new WebSocket(
    `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY_MYLIK}`
);

const AGGREGATE_INDEX = "5";

socket.addEventListener("message", e => {
   // console.log(e)
   const {TYPE: type, FROMSYMBOL: currency, PRICE: newPrice} = JSON.parse(
       e.data
   );
   if (type !== AGGREGATE_INDEX || newPrice === undefined) {
      return;
   }
   const handlers = tickersHandlers.get(currency) ?? [];
   handlers.forEach(fn => fn(newPrice));
});

function sendToWebSocket(message) {
   const stringifiedMessage = JSON.stringify(message);

   if (socket.readyState === WebSocket.OPEN) {
      socket.send(stringifiedMessage);
      return;
   }

   socket.addEventListener(
       "open",
       () => {
          socket.send(stringifiedMessage);
       },
       { once: true }
   );
}

function subscribeToTickerOnWs(ticker) {
   sendToWebSocket({
      action: "SubAdd",
      subs: [`5~CCCAGG~${ticker}~USD`]
   });
}

function unsubscribeFromTickerOnWs(ticker) {
   sendToWebSocket({
      action: "SubRemove",
      subs: [`5~CCCAGG~${ticker}~USD`]
   });
}

export const subscribeToTicker = (ticker, cb) => {
   const subscribers = tickersHandlers.get(ticker) || [];
   tickersHandlers.set(ticker, [...subscribers, cb]);
   subscribeToTickerOnWs(ticker);
};

export const unsubscribeFromTicker = ticker => {
   tickersHandlers.delete(ticker);
   unsubscribeFromTickerOnWs(ticker);
};





