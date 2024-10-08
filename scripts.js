import config from './config.js';
import { PaydownUs, PaydownThem, calculatePayment } from './engine.js';

function clear() {
    document.getElementById("out").innerText = "";
    document.getElementById("error").innerText = "";
}

function out(s) {
    document.getElementById("out").innerText = document.getElementById("out").innerText + "\n"  + s;
}

function error(s) {
    document.getElementById("error").innerText = document.getElementById("error").innerText + "\n"  + s;
}

function report(results, title) {
    let rows = results.schedule;
    if (results.error) {
        out(results.error);
    }
    out('');
    out('');
    out('----------------------------------------');
    out(title);
    out('');

    out("Period  Date           Balance   Principal    Interest     Payment     APR");
    out("======  ==========  ==========  ==========  ==========  ==========  ======");
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        out(`${row.period.toString().padStart(6, ' ')}  ${row.date}  ${row.bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(10, ' ')}  ${row.principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(10, ' ')}  ${row.interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(10, ' ')}  ${row.payment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(10, ' ')}  ${(100*row.apr).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).padStart(6, ' ')}`);
    }
}

function _calc(THIS) {
    clear();
    console.log("calc");
    console.log(`Balance: ${THIS.balance}`);
    console.log(`periodsPerYear: ${THIS.periodsPerYear}`);

    let band = config.get_band(THIS.balance);

    try {
        let us = new PaydownUs(THIS.balance, THIS.periodsPerYear, start);
        let usResults = us.runSchedule();
        let them = new PaydownThem(THIS.balance, THIS.apr, THIS.pmt, start);
        let themResults = them.runSchedule();

        if (usResults.error) {
            error(`${usResults.error}`);
            error('');
        }

        if (themResults.error) {
            error(`${themResults.error}`);
            error('');
        }

        let savings = themResults.totalInterest - usResults.totalInterest;
        THIS.savings = savings.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        out(`Our   Total Interest:   ${usResults.totalInterest.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).padStart(12, ' ')}      Term: ${usResults.term.toFixed(0).padStart(3, ' ')}      Max Payment: ${usResults.maxPmt.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).padStart(10, ' ')}`);
        out(`Their Total Interest:   ${themResults.totalInterest.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).padStart(12, ' ')}      Term: ${themResults.term.toFixed(0).padStart(3, ' ')}      Max Payment: ${themResults.maxPmt.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).padStart(10, ' ')}`);
        out(`Total Interest Savings: ${savings.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).padStart(12, ' ')}`);

        report(usResults, `Our Schedule\n\nBand: ${band}`);
        report(themResults, 'Their Schedule');
    } catch (e) {
        out(e);
    }


}

let urlParams = new URLSearchParams(window.location.search);

let start = new Date();
start.setMonth(start.getMonth() + 1);
start.setDate(1);

let balance = urlParams.has('balance') ? parseFloat(urlParams.get('balance')) : config.MinInitBal;
let apr = urlParams.has('apr') ? parseFloat(urlParams.get('apr')) : 200;
let ppy = urlParams.has('ppy') ? parseFloat(urlParams.get('ppy')) : 12;
let term = urlParams.has('term') ? parseFloat(urlParams.get('term')) : 24;
let pmt = urlParams.has('pmt') ? parseFloat(urlParams.get('pmt')) : 500;
start = urlParams.has('start') ? new Date(urlParams.get('start') + 'T00:00:00') : start;

const { createApp } = Vue;
createApp({
    data() {
        return {
            balance: balance,
            periodsPerYear: ppy,
            term: term,
            apr: apr,
            pmt: pmt,
            config: config,
            start: start,
            savings: 0,
            timeout: null
        };
    },
    watch: {
        balance: 'delayedCalc',
        periodsPerYear: 'delayedCalc',
        term: 'delayedCalc',
        apr: 'delayedCalc',
        pmt: 'delayedCalc'
    },
    mounted() {
        this.calc(this);
    },
    methods: {
        setTerm(term) {
            this.pmt = calculatePayment(this.balance, this.apr / 1200, term).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },
        calc() {
            _calc(this);
        },
        delayedCalc() {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                this.calc();
            }, 1000);
        }
    }
}).mount('#app');
