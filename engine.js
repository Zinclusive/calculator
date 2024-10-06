import config from './config.js';

function calculatePayment(principal, rate, term) {
    const payment = principal * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
    return payment;
}
if (calculatePayment(100000, 0.12 / 12, 360) !== 1028.6125969255042) {
    throw new Error('Payment calculation is incorrect');
}

class PaydownUs {
    constructor(balance, periodsPerYear, start) {
        this.balance = balance
        this.periodsPerYear = periodsPerYear
        this.start = start
    }

    runSchedule() {
        const schedule = [];

        let balance = parseFloat(this.balance) + parseFloat(config.OrigFee);
        const orig_date = this.start;
        const periods_per_year = this.periodsPerYear;

        if (balance < config.MinInitBal) {
            throw new Error(`Balance must be at least ${config.MinInitBal}`);
        }

        const band = config.get_band(balance);
        const MinPmtFloor = config.MinPmtFloor[band];
        const MinPmtPctPrin = config.MinPmtPctPrin[band];
        console.log(`MinPmtFloor: ${MinPmtFloor}`);
        console.log(`MinPmtPctPrin: ${MinPmtPctPrin}`);

        let apr = config.Apr / 100;
        let d = new Date(orig_date);
        let ld = new Date(d);
        let b = balance;
        let totalInterest = 0;

        for (var i = 0; i < 1000; i++) {
            if (i > 200) {
                return {
                    'error': 'Scenario does not paydown. Perhaps payment is too low for the interest rate.',
                    'totalInterest': totalInterest,
                    "term": i + 1,
                    'schedule': schedule
                }
            }

            if (i >= config.AprDropsOn) {
                apr = config.AprDropsTo / 100;
            }
            const perdiem_rate = apr / 365;

            const daysSinceOrigination = Math.floor((d - orig_date) / (1000 * 60 * 60 * 24));
            const days = Math.floor((d - ld) / (1000 * 60 * 60 * 24));
            ld = new Date(d);

            const stDays = days;

            if (i === 0) {
                schedule.push({
                    period: i,
                    date: d.toISOString().split('T')[0],
                    bal: b,
                    stDays: 0,
                    principal: 0,
                    interest: 0,
                    payment: 0,
                    apr: 0,
                });
            } else {
                const Int = Math.round(b * perdiem_rate * stDays * 100) / 100;
                totalInterest += Int;
                const MinPmtPrin = b * (MinPmtPctPrin / 100) * 12 / periods_per_year;
                const bi = b + Int;
                const pmt = Math.min(bi, Math.max(MinPmtPrin + Int, MinPmtFloor));

                b = bi - pmt;
                if (i < 10) {
                    console.log(`b=${b.toFixed(2)}, days=${stDays} MinPmtPrin=${MinPmtPrin.toFixed(2)} MinPmtFloor=${MinPmtFloor.toFixed(2)} Int=${Int.toFixed(2)} Pmt=${pmt.toFixed(2)}`);
                }

                schedule.push({
                    period: i,
                    date: d.toISOString().split('T')[0],
                    bal: b,
                    stDays: stDays,
                    principal: pmt - Int,
                    interest: Int,
                    payment: pmt,
                    apr: apr,
                });
            }

            if (this.periodsPerYear === 12) {
                d.setMonth(d.getMonth() + 1);
            } else {
                d.setDate(d.getDate() + Math.floor(Math.round(365 / this.periodsPerYear)));
            }
            if (b <= 0) {
                break;
            }
        }
        return {
            'error': null,
            'totalInterest': totalInterest,
            "term": i,
            'schedule': schedule
        }
    }
}




class PaydownThem {
    constructor(balance, apr, pmt, start) {
        this.balance = balance;
        this.apr = apr;
        this.pmt = pmt;
        this.start = start
    }

    runSchedule() {
        const schedule = [];

        let balance = parseFloat(this.balance)
        const orig_date = this.start;

        const periods_per_year = 12; // config.PeriodsPerYear;

        let apr = this.apr / 100;
        let pmt = this.pmt;
        let d = new Date(orig_date);
        let ld = new Date(d);
        let b = balance;
        let totalInterest = 0;

        for (var i = 0; i < 1000; i++) {
            if (i > 200) {
                return {
                    'error': 'Scenario does not paydown. Perhaps payment is too low for the interest rate.',
                    'totalInterest': 0,
                    'term': i + 1,
                    'schedule': schedule
                }
            }

            const daysSinceOrigination = Math.floor((d - orig_date) / (1000 * 60 * 60 * 24));
            const days = Math.floor((d - ld) / (1000 * 60 * 60 * 24));
            ld = new Date(d);

            const stDays = days;

            if (i === 0) {
                schedule.push({
                    period: i,
                    date: d.toISOString().split('T')[0],
                    bal: b,
                    stDays: 0,
                    principal: 0,
                    interest: 0,
                    payment: 0,
                    apr: 0,
                });
            } else {
                const interestPayment = b * (this.apr / 12 / 100);
                const principalPayment = Math.min(b, pmt - interestPayment);
                pmt = principalPayment + interestPayment;
                b -= principalPayment;
                totalInterest += interestPayment;
                    schedule.push({
                    period: i,
                    date: d.toISOString().split('T')[0],
                    bal: b,
                    stDays: stDays,
                    principal: principalPayment,
                    interest: interestPayment,
                    payment: pmt,
                    apr: apr,
                });
            }

            if (periods_per_year === 12) {
                d.setMonth(d.getMonth() + 1);
            } else {
                d.setDate(d.getDate() + Math.floor(Math.round(365 / periods_per_year)));
            }
            if (b <= 0) {
                break;
            }
        }
        return {
            'error': null,
            'totalInterest': totalInterest,
            'term': i,
            'schedule': schedule
        }

        return schedule;
    }
}

export { PaydownUs, PaydownThem };
