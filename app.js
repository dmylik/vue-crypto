import {apiListOllCrypt,
        updatePriceTickets,
        unsubscribeFromTicker,
        deleteInterval,
        subscribeToTicker} from "./api.js";

const App = {
    data: () => ({
        setView: {
            txtIncludes: false,
            graphik: false,
            bufferWallets: [],
        },
        wallet: "",
        textFilter: "",
        wallets: [],
        defaultWallets: [],
        ollListCrypt: [],
        graphPrice: [],
        walChoose: null,
        page: 1,
    }),
    methods: {
        updateToWallets(){
            (this.wallets).forEach(oneWallets => {
                subscribeToTicker(oneWallets.name, (mess)=>{
                    // console.log(oneWallets)
                    // console.log(mess)
                    oneWallets.price = mess;
                        if(oneWallets.name.includes(this.walChoose))
                            this.graphPrice.push(mess);
                        if(this.graphPrice.length > 50)
                            this.graphPrice.shift();
                })
            })
            // deleteInterval();
            let nameOllWallets = (this.wallets.map(ar => ar.name));
            // updatePriceTickets((nameOllWallets).join(','), (data)=>{
            //     this.wallets.forEach(one =>  one.price = this.normalizePrice(data[one.name]?.USD));
            //     if(nameOllWallets.includes(this.walChoose))
            //         this.graphPrice.push(data[this.walChoose].USD);
            //     if(this.graphPrice.length > 50)
            //         this.graphPrice.shift();
            //
            // })
        },
        add(){
            if(this.defaultWallets.find(el => el.Symbol === this.wallet.toUpperCase()))
            if(this.wallets.find((el)=>el.name === this.wallet)){
                this.setView.txtIncludes = true;
            } else {
                const newTicket = {
                    name: this.wallet,
                    price: '-'
                };

                this.wallets = [...this.wallets, newTicket];
                this.updateToWallets();
                this.wallet = '';
                this.textFilter = '';
                this.setView.txtIncludes = false;
            }
        },
        async listCrypt (){
            const data = await apiListOllCrypt();
            let objCrypt = data.Data;
            let bufArrayForCrypt = [];

            for (let one in objCrypt) bufArrayForCrypt.push(objCrypt[one])

            this.ollListCrypt = await bufArrayForCrypt;
        },
        deleteWall(ibx){
            unsubscribeFromTicker(this.wallets[ibx].name)
            this.wallets.splice(ibx,1);
            this.wallets = [... this.wallets];

            // this.updateToWallets()
        },
        setDefaultWallet(val){
            this.wallet = val;
            this.add();
        },
        chooseWal(val){
            if(this.walChoose !== val ){
                // this.graphPrice.length = 0;
                this.walChoose = val;
            }
        },
        historyURL(){
            window.history.pushState(
                null,
                document.title,
                `${window.location.pathname}?filter=${this.textFilter}&page=${this.page}`
            );
        },
        normalizePrice(newPrice){
            if(newPrice === 0 || Number.isInteger(newPrice))
                return '-';
            return newPrice > 1
                ? newPrice.toFixed(2)
                : ( newPrice.toPrecision(2));
        },
    },
    watch: {
        wallet(wal){
            this.setView.txtIncludes = false;
            if(wal.length > 0) {
                let firstFind = []
                firstFind.push(this.ollListCrypt.find(el => el?.Symbol === wal.toUpperCase()))

                let findArr = this.ollListCrypt.filter((el) => (el?.Symbol.includes(wal.toUpperCase())));

                let ollFind= [];
                if(firstFind.length !== undefined && findArr.length > 1 )
                    ollFind = firstFind.concat(findArr)
                else ollFind = findArr;

                if (ollFind.length > 4)
                    ollFind.length = 4;
                this.defaultWallets = ollFind
            }
            else {
                this.defaultWallets.length = 0;
            }
        },
        wallets(){
            localStorage.setItem("crypto-list", JSON.stringify(this.wallets));
        },
        page(){this.historyURL();},
        paginatorList(){ // можно подписаться на изменение массива возвращаемого из computed
            if(this.paginatorList.length ===0 && this.page >1)
                this.page =  this.page - 1;
        },
        walChoose(){
            this.graphPrice.length = 0;
        },
        textFilter(){
            this.page = 1;
            this.historyURL();
        }
    },
    computed: { // computed это список свойчтв (вызов без ())
        // которые не меняют состояние а производят расчеты
        filterWallets(){return (this.wallets.filter(one => (one?.name.includes(this.textFilter.toUpperCase()))));},
        lastPage(){return (this.filterWallets.length - (6*this.page) > 0);},
        paginatorList(){return this.filterWallets.slice(6 * (this.page -1), 6 * this.page);},
        maxGraphPrice(){return Math.max(...this.graphPrice);},
        minGraphPrice(){return Math.min(...this.graphPrice);},
        graphNormalize(){
            const max = this.maxGraphPrice;
            const min = this.minGraphPrice;
            return this.graphPrice
                .map(el=> (5+(((el - min)*95)/(max*1.00001 - min)))
                    .toFixed(1));
        },
        changeWal(){
            let length = this.graphPrice.length-1;
            if(length>0){
                return (this.graphPrice[length] - this.graphPrice[length-1]).toFixed(2);
            } else return 0;
        },
    },
    created() {
        this.listCrypt();
        const cryptoListLS = localStorage.getItem("crypto-list");

        if(cryptoListLS) {
            this.wallets = JSON.parse(cryptoListLS);
            this.updateToWallets()
            // this.startFetch((this.wallets.map(ar => ar.name)).join(','))
        }

        this.setView.bufferWallets = this.wallets;

        const objFromURL =  Object.fromEntries(new URL(window.location).searchParams.entries())
        console.log(objFromURL)

        if(objFromURL.filter) this.textFilter = objFromURL.filter;
        if(objFromURL.page) this.page = objFromURL.page;
    },
}



Vue.createApp(App).mount('#container')